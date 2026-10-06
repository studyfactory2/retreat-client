import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  getStaffDraftPhotos,
  removeStaffDraftPhoto,
  uploadStaffDraftPhoto,
} from '../../../../features/staff-draft-photos/staff-draft-photos-api';
import type { StaffDraftPhotoListDto } from '../../../../features/staff-draft-photos/staff-draft-photos.types';
import { validateStaffPhotoSelection } from '../../../../features/staff-draft-photos/staff-draft-photos-validation';
import {
  isStaffPhotoAccessError,
  isStaffPhotoWriteUncertain,
  STAFF_PHOTO_QUEUE_LIMIT,
  STAFF_PHOTO_UPLOAD_CONCURRENCY,
  staffPhotoFailureMessage,
  uncertainStaffPhotoMessage,
  type QueuedStaffPhoto,
} from '../model/staff-draft-photo-model';

type PhotoResource =
  | { status: 'loading' }
  | { status: 'ready'; list: StaffDraftPhotoListDto }
  | { status: 'error' | 'unavailable'; message: string };
type PhotoState = {
  resource: PhotoResource;
  queue: QueuedStaffPhoto[];
  busy: boolean;
  writing: boolean;
  notice: string;
  removal: { id: string; checked: boolean } | null;
};
type Options = {
  token: string;
  draftId: string;
  expiresAt: string;
  locked: boolean;
  accessReady: boolean;
  onAccessRejected: () => void;
};
type Operation = {
  controller: AbortController;
  kind: 'read' | 'upload' | 'remove';
  photoId?: string;
};
const initialState = (): PhotoState => ({
  resource: { status: 'loading' },
  queue: [],
  busy: false,
  writing: false,
  notice: '',
  removal: null,
});

export function useStaffDraftPhotos({
  token,
  draftId,
  expiresAt,
  locked,
  accessReady,
  onAccessRejected,
}: Options) {
  const owner = useMemo(
    () => ({ token, draftId, expiresAt }),
    [token, draftId, expiresAt],
  );
  const scope = useRef<typeof owner | null>(owner);
  const options = useRef({ locked, accessReady, onAccessRejected });
  const operation = useRef<Operation | null>(null);
  const lastList = useRef<StaffDraftPhotoListDto | null>(null);
  const counter = useRef(0);
  const current = useRef<{ owner: typeof owner; state: PhotoState } | null>(
    null,
  );
  const [result, setResult] = useState<typeof current.current>(null);
  const read = useCallback(
    () =>
      current.current?.owner === owner ? current.current.state : initialState(),
    [owner],
  );
  const publish = useCallback(
    (change: (state: PhotoState) => PhotoState) => {
      if (scope.current !== owner) return;
      const next = { owner, state: change(read()) };
      current.current = next;
      setResult(next);
    },
    [owner, read],
  );
  useLayoutEffect(() => {
    options.current = { locked, accessReady, onAccessRejected };
  }, [locked, accessReady, onAccessRejected]);
  useLayoutEffect(() => {
    scope.current = owner;
    lastList.current = null;
    publish(() => initialState());
    return () => {
      scope.current = null;
      operation.current?.controller.abort();
      operation.current = null;
      lastList.current = null;
      current.current = null;
    };
  }, [owner, publish]);

  const rejectAccess = useCallback(() => {
    if (scope.current !== owner) return;
    operation.current?.controller.abort();
    operation.current = null;
    lastList.current = null;
    publish(() => ({
      ...initialState(),
      resource: {
        status: 'unavailable',
        message:
          '이 작성 링크를 사용할 수 없습니다. 작성 링크를 다시 확인해 주세요.',
      },
    }));
    options.current.onAccessRejected();
  }, [owner, publish]);
  const alive = useCallback(() => {
    if (scope.current !== owner) return false;
    if (Date.parse(owner.expiresAt) <= Date.now()) {
      rejectAccess();
      return false;
    }
    return read().resource.status !== 'unavailable';
  }, [owner, read, rejectAccess]);
  const pause = useCallback(() => {
    if (scope.current !== owner) return;
    const interrupted = operation.current;
    interrupted?.controller.abort();
    operation.current = null;
    publish((state) => ({
      ...state,
      resource:
        state.resource.status === 'unavailable'
          ? state.resource
          : { status: 'loading' },
      busy: false,
      writing: false,
      queue: state.queue.map((entry) =>
        entry.status === 'uploading'
          ? {
              ...entry,
              status: 'uncertain',
              checked: false,
              message: uncertainStaffPhotoMessage,
            }
          : { ...entry, checked: false },
      ),
      removal:
        interrupted?.kind === 'remove' && interrupted.photoId
          ? { id: interrupted.photoId, checked: false }
          : state.removal
            ? { ...state.removal, checked: false }
            : null,
    }));
  }, [owner, publish]);

  const readList = useCallback(
    async (job: Operation): Promise<StaffDraftPhotoListDto | null> => {
      const active = () =>
        scope.current === owner &&
        operation.current === job &&
        !job.controller.signal.aborted &&
        options.current.accessReady;
      try {
        const list = await getStaffDraftPhotos(
          owner.token,
          job.controller.signal,
        );
        if (!active() || !alive()) return null;
        lastList.current = list;
        publish((state) => ({
          ...state,
          resource: { status: 'ready', list },
          queue: state.queue.map((entry) =>
            entry.status === 'failed' || entry.status === 'uncertain'
              ? { ...entry, checked: true }
              : entry,
          ),
          removal:
            state.removal &&
            list.items.some((photo) => photo.id === state.removal?.id)
              ? { ...state.removal, checked: true }
              : null,
          notice:
            state.removal &&
            !list.items.some((photo) => photo.id === state.removal?.id)
              ? '현재 사진 목록에 해당 사진이 없습니다. 최신 목록을 확인해 주세요.'
              : state.notice,
        }));
        return list;
      } catch (error: unknown) {
        if (!active()) return null;
        if (isStaffPhotoAccessError(error)) rejectAccess();
        else
          publish((state) => ({
            ...state,
            resource: {
              status: 'error',
              message:
                '사진 목록을 확인하지 못했습니다. 사진을 다시 보내지 말고 목록부터 확인해 주세요.',
            },
          }));
        return null;
      }
    },
    [alive, owner, publish, rejectAccess],
  );
  const refresh = useCallback(async () => {
    if (!alive() || !options.current.accessReady) return null;
    pause();
    const job: Operation = { controller: new AbortController(), kind: 'read' };
    operation.current = job;
    publish((state) => ({ ...state, busy: true }));
    try {
      return await readList(job);
    } finally {
      if (operation.current === job) {
        operation.current = null;
        publish((state) => ({ ...state, busy: false }));
      }
    }
  }, [alive, pause, publish, readList]);

  useEffect(() => {
    if (accessReady) void refresh();
    else pause();
  }, [accessReady, pause, refresh]);

  const runQueue = useCallback(async () => {
    if (
      !alive() ||
      operation.current ||
      options.current.locked ||
      !options.current.accessReady
    )
      return;
    const before = read();
    if (
      before.resource.status !== 'ready' ||
      before.removal ||
      before.queue.some(
        (entry) => entry.status === 'failed' || entry.status === 'uncertain',
      ) ||
      !before.queue.some((entry) => entry.status === 'queued')
    )
      return;
    const job: Operation = {
      controller: new AbortController(),
      kind: 'upload',
    };
    operation.current = job;
    let stopped = false;
    const active = () =>
      scope.current === owner &&
      operation.current === job &&
      !job.controller.signal.aborted &&
      options.current.accessReady;
    publish((state) => ({ ...state, busy: true, writing: true, notice: '' }));
    const worker = async () => {
      while (active() && !stopped && !options.current.locked) {
        const state = read();
        const entry = state.queue.find(
          (candidate) => candidate.status === 'queued',
        );
        if (!entry || !entry.file || state.resource.status !== 'ready') return;
        if (!alive()) return;
        const uploading = state.queue.filter(
          (candidate) => candidate.status === 'uploading',
        ).length;
        if (
          state.resource.list.items.length + uploading >=
          state.resource.list.limits.maxPhotos
        ) {
          stopped = true;
          publish((value) => ({
            ...value,
            queue: value.queue.map((candidate) =>
              candidate.status === 'queued'
                ? {
                    ...candidate,
                    status: 'failed',
                    checked: false,
                    message:
                      '추가할 수 있는 사진 수를 넘었습니다. 최신 사진 목록을 확인해 주세요.',
                  }
                : candidate,
            ),
          }));
          return;
        }
        publish((value) => ({
          ...value,
          queue: value.queue.map((candidate) =>
            candidate.id === entry.id
              ? {
                  ...candidate,
                  status: 'uploading',
                  message: '',
                  checked: false,
                }
              : candidate,
          ),
        }));
        try {
          const photo = await uploadStaffDraftPhoto(
            entry.file,
            state.resource.list.limits,
            owner.token,
            job.controller.signal,
          );
          if (!active() || !alive()) return;
          publish((value) => ({
            ...value,
            queue: value.queue.filter((candidate) => candidate.id !== entry.id),
            resource:
              value.resource.status === 'ready'
                ? {
                    status: 'ready',
                    list: {
                      ...value.resource.list,
                      items: [
                        ...value.resource.list.items.filter(
                          (item) => item.id !== photo.id,
                        ),
                        photo,
                      ],
                    },
                  }
                : value.resource,
            notice:
              '사진을 추가했습니다. 아직 정비 기록을 최종 제출한 것은 아닙니다.',
          }));
        } catch (error: unknown) {
          if (!active()) return;
          stopped = true;
          if (isStaffPhotoAccessError(error)) {
            rejectAccess();
            return;
          }
          const uncertain = isStaffPhotoWriteUncertain(error);
          publish((value) => ({
            ...value,
            queue: value.queue.map((candidate) =>
              candidate.id === entry.id
                ? {
                    ...candidate,
                    status: uncertain ? 'uncertain' : 'failed',
                    checked: false,
                    message: uncertain
                      ? uncertainStaffPhotoMessage
                      : staffPhotoFailureMessage(error),
                  }
                : candidate,
            ),
          }));
        }
      }
    };
    try {
      await Promise.all(
        Array.from({ length: STAFF_PHOTO_UPLOAD_CONCURRENCY }, () => worker()),
      );
      if (!active()) return;
      job.kind = 'read';
      publish((state) => ({
        ...state,
        writing: false,
        resource: { status: 'loading' },
      }));
      await readList(job);
    } finally {
      if (operation.current === job) {
        operation.current = null;
        publish((state) => ({ ...state, busy: false, writing: false }));
      }
    }
  }, [alive, owner, publish, read, readList, rejectAccess]);

  const uploadFiles = useCallback(
    (files: FileList | readonly File[]) => {
      if (!alive()) return;
      const state = read();
      const list =
        state.resource.status === 'ready'
          ? state.resource.list
          : lastList.current;
      if (
        !list ||
        state.removal ||
        operation.current?.kind === 'upload' ||
        operation.current?.kind === 'remove'
      )
        return;
      const selected = Array.from(files);
      if (!selected.length) return;
      const room = STAFF_PHOTO_QUEUE_LIMIT - state.queue.length;
      if (selected.length > room) {
        publish((value) => ({
          ...value,
          notice: `한 번에 최대 ${STAFF_PHOTO_QUEUE_LIMIT}장까지 선택할 수 있습니다. 현재 선택을 정리한 뒤 다시 선택해 주세요.`,
        }));
        return;
      }
      let available = Math.max(
        0,
        list.limits.maxPhotos -
          list.items.length -
          state.queue.filter((entry) => entry.status !== 'invalid').length,
      );
      const entries: QueuedStaffPhoto[] = selected.map((file) => {
        const message =
          validateStaffPhotoSelection(file, list.limits) ||
          (available <= 0
            ? `사진은 최대 ${list.limits.maxPhotos}장까지 추가할 수 있습니다.`
            : '');
        if (!message) available -= 1;
        return {
          id: ++counter.current,
          file: message ? null : file,
          filename: file.name,
          sizeBytes: file.size,
          status: message ? 'invalid' : 'queued',
          message,
          checked: false,
        };
      });
      publish((value) => ({
        ...value,
        queue: [...value.queue, ...entries],
        notice: '',
      }));
      // Native file pickers may return after a foreground access recheck has begun.
      // Keep their files staged; only a verified, unlocked session starts uploads.
      if (
        options.current.accessReady &&
        !options.current.locked &&
        !operation.current
      )
        void runQueue();
    },
    [alive, publish, read, runQueue],
  );

  const retry = useCallback(
    (id: number) => {
      if (
        !alive() ||
        operation.current ||
        options.current.locked ||
        !options.current.accessReady
      )
        return;
      const state = read();
      const entry = state.queue.find((candidate) => candidate.id === id);
      if (
        state.resource.status !== 'ready' ||
        entry?.status !== 'failed' ||
        !entry.checked ||
        !entry.file
      )
        return;
      publish((value) => ({
        ...value,
        queue: value.queue.map((candidate) =>
          candidate.id === id
            ? { ...candidate, status: 'queued', checked: false, message: '' }
            : candidate,
        ),
      }));
      void runQueue();
    },
    [alive, publish, read, runQueue],
  );
  const dismiss = useCallback(
    (id: number) => {
      if (scope.current !== owner) return;
      const state = read();
      const entry = state.queue.find((candidate) => candidate.id === id);
      if (
        !entry ||
        entry.status === 'uploading' ||
        (entry.status === 'uncertain' &&
          (!entry.checked ||
            state.resource.status !== 'ready' ||
            !options.current.accessReady))
      )
        return;
      publish((value) => ({
        ...value,
        queue: value.queue.filter((candidate) => candidate.id !== id),
      }));
    },
    [owner, publish, read],
  );

  const remove = useCallback(
    async (id: string) => {
      if (
        !alive() ||
        operation.current ||
        options.current.locked ||
        !options.current.accessReady
      )
        return;
      const state = read();
      if (
        state.resource.status !== 'ready' ||
        state.queue.length ||
        state.removal ||
        !state.resource.list.items.some((photo) => photo.id === id)
      )
        return;
      const job: Operation = {
        controller: new AbortController(),
        kind: 'remove',
        photoId: id,
      };
      operation.current = job;
      const active = () =>
        scope.current === owner &&
        operation.current === job &&
        !job.controller.signal.aborted &&
        options.current.accessReady;
      publish((value) => ({ ...value, busy: true, writing: true, notice: '' }));
      try {
        await removeStaffDraftPhoto(id, owner.token, job.controller.signal);
        if (!active() || !alive()) return;
        job.kind = 'read';
        publish((value) => ({
          ...value,
          writing: false,
          resource: { status: 'loading' },
          notice: '사진을 삭제했습니다.',
        }));
        await readList(job);
      } catch (error: unknown) {
        if (!active()) return;
        if (isStaffPhotoAccessError(error)) rejectAccess();
        else if (isStaffPhotoWriteUncertain(error))
          publish((value) => ({
            ...value,
            removal: { id, checked: false },
            notice:
              '사진 삭제 결과를 확인하지 못했습니다. 사진 목록을 다시 확인해 주세요.',
          }));
        else
          publish((value) => ({
            ...value,
            resource: {
              status: 'error',
              message:
                '삭제를 다시 시도하기 전에 최신 사진 목록을 확인해 주세요.',
            },
            notice: staffPhotoFailureMessage(error),
          }));
      } finally {
        if (operation.current === job) {
          operation.current = null;
          publish((value) => ({ ...value, busy: false, writing: false }));
        }
      }
    },
    [alive, owner, publish, read, readList, rejectAccess],
  );
  const acknowledgeRemoval = useCallback(() => {
    if (!alive() || operation.current || !options.current.accessReady) return;
    if (read().resource.status !== 'ready' || !read().removal?.checked) return;
    publish((state) => ({
      ...state,
      removal: null,
      notice:
        '현재 목록을 확인했습니다. 사진이 남아 있다면 삭제를 다시 선택할 수 있습니다.',
    }));
  }, [alive, publish, read]);
  const hasPendingWork = useCallback(() => {
    if (scope.current !== owner) return false;
    const state = read();
    return state.queue.length > 0 || state.writing || state.removal !== null;
  }, [owner, read]);

  useEffect(() => {
    let away = document.visibilityState === 'hidden';
    const leave = () => {
      away = true;
    };
    const resume = () => {
      if (!away || document.visibilityState === 'hidden') return;
      away = false;
      void refresh();
    };
    const visibility = () =>
      document.visibilityState === 'hidden' ? leave() : resume();
    const pageHidden = () => {
      leave();
      pause();
    };
    const restored = (event: PageTransitionEvent) => {
      if (event.persisted) {
        away = false;
        void refresh();
      }
    };
    const warn = (event: BeforeUnloadEvent) => {
      if (!hasPendingWork()) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('blur', leave);
    window.addEventListener('focus', resume);
    window.addEventListener('pagehide', pageHidden);
    window.addEventListener('pageshow', restored);
    window.addEventListener('beforeunload', warn);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('blur', leave);
      window.removeEventListener('focus', resume);
      window.removeEventListener('pagehide', pageHidden);
      window.removeEventListener('pageshow', restored);
      window.removeEventListener('beforeunload', warn);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [hasPendingWork, pause, refresh]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(
        () => {
          if (scope.current !== owner) return;
          if (Date.parse(owner.expiresAt) > Date.now()) schedule();
          else rejectAccess();
        },
        Math.min(
          Math.max(0, Date.parse(owner.expiresAt) - Date.now()),
          2_147_483_647,
        ),
      );
    };
    schedule();
    return () => clearTimeout(timer);
  }, [owner, rejectAccess]);

  const state = result?.owner === owner ? result.state : initialState();
  const resource: PhotoResource =
    accessReady || state.resource.status === 'unavailable'
      ? state.resource
      : { status: 'loading' };
  const canWrite =
    !locked &&
    accessReady &&
    resource.status === 'ready' &&
    !state.busy &&
    state.removal === null;
  return {
    ...state,
    resource,
    items: resource.status === 'ready' ? resource.list.items : [],
    limits: resource.status === 'ready' ? resource.list.limits : null,
    canSelect:
      canWrite &&
      state.queue.length === 0 &&
      resource.status === 'ready' &&
      resource.list.items.length < resource.list.limits.maxPhotos,
    canWrite,
    uploadFiles,
    retry,
    dismiss,
    continueQueue: runQueue,
    remove,
    refresh,
    acknowledgeRemoval,
    hasPendingWork,
  };
}

export type StaffDraftPhotosController = ReturnType<typeof useStaffDraftPhotos>;
