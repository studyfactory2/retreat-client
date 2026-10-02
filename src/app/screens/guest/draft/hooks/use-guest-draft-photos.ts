import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  getGuestDraftPhotos,
  getGuestDraftPhotoView,
  removeGuestDraftPhoto,
  uploadGuestDraftPhoto,
} from '../../../../features/guest-draft-photos/guest-draft-photos-api';
import type {
  GuestDraftPhotoDto,
  GuestDraftPhotoListDto,
} from '../../../../features/guest-draft-photos/guest-draft-photos.types';
import {
  isPhotoAccessError,
  isPhotoWriteUncertain,
  photoFailureMessage,
  uncertainPhotoMessage,
  type QueuedGuestPhoto,
} from '../model/guest-draft-photo-model';

type PhotoResource =
  | { status: 'loading' }
  | { status: 'ready'; list: GuestDraftPhotoListDto }
  | { status: 'error' | 'unavailable'; message: string };
type PhotoState = {
  resource: PhotoResource;
  queue: QueuedGuestPhoto[];
  busy: boolean;
  writing: boolean;
  notice: string;
  removal: { id: string; checked: boolean } | null;
};
type Options = {
  token: string;
  draftId: string;
  locked: boolean;
  onAccessRejected: () => void;
};
const initialState = (): PhotoState => ({
  resource: { status: 'loading' },
  queue: [],
  busy: false,
  writing: false,
  notice: '',
  removal: null,
});

export function useGuestDraftPhotos({
  token,
  draftId,
  locked,
  onAccessRejected,
}: Options) {
  const owner = useMemo(() => ({ token, draftId }), [token, draftId]);
  const scope = useRef<typeof owner | null>(owner);
  const options = useRef({ locked, onAccessRejected });
  const operation = useRef<AbortController | null>(null);
  const previews = useRef(new Set<AbortController>());
  const deferredRead = useRef(false);
  const counter = useRef(0);
  const current = useRef<{ owner: typeof owner; state: PhotoState }>({
    owner,
    state: initialState(),
  });
  const [result, setResult] = useState(() => ({
    owner,
    state: initialState(),
  }));
  useLayoutEffect(() => {
    options.current = { locked, onAccessRejected };
  }, [locked, onAccessRejected]);
  const read = useCallback(
    () =>
      current.current.owner === owner ? current.current.state : initialState(),
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
    scope.current = owner;
    deferredRead.current = false;
    const pendingPreviews = previews.current;
    return () => {
      scope.current = null;
      operation.current?.abort();
      operation.current = null;
      for (const request of pendingPreviews) request.abort();
      pendingPreviews.clear();
    };
  }, [owner]);

  const rejectAccess = useCallback(() => {
    if (scope.current !== owner) return;
    operation.current?.abort();
    for (const request of previews.current) request.abort();
    publish(() => ({
      ...initialState(),
      resource: {
        status: 'unavailable',
        message: '작성 링크의 상태를 다시 확인하고 있습니다.',
      },
    }));
    options.current.onAccessRejected();
  }, [owner, publish]);

  const readList = useCallback(
    async (
      controller: AbortController,
    ): Promise<GuestDraftPhotoListDto | null> => {
      const active = () =>
        scope.current === owner &&
        operation.current === controller &&
        !controller.signal.aborted;
      try {
        const list = await getGuestDraftPhotos(owner.token, controller.signal);
        if (!active()) return null;
        publish((state) => ({
          ...state,
          resource: { status: 'ready', list },
          queue: state.queue.map((entry) =>
            entry.status === 'uncertain' ? { ...entry, checked: true } : entry,
          ),
          removal:
            state.removal &&
            list.items.some((photo) => photo.id === state.removal?.id)
              ? { ...state.removal, checked: true }
              : null,
        }));
        return list;
      } catch (error: unknown) {
        if (!active()) return null;
        if (isPhotoAccessError(error)) rejectAccess();
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
    [owner, publish, rejectAccess],
  );

  const refresh =
    useCallback(async (): Promise<GuestDraftPhotoListDto | null> => {
      if (
        scope.current !== owner ||
        (read().resource.status === 'unavailable' && options.current.locked)
      )
        return null;
      if (operation.current) {
        deferredRead.current = true;
        return null;
      }
      const controller = new AbortController();
      operation.current = controller;
      deferredRead.current = false;
      publish((state) => ({ ...state, busy: true }));
      try {
        return await readList(controller);
      } finally {
        if (operation.current === controller) {
          operation.current = null;
          publish((state) => ({ ...state, busy: false }));
        }
      }
    }, [owner, publish, read, readList]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runQueue = useCallback(async () => {
    if (scope.current !== owner || operation.current || options.current.locked)
      return;
    const before = read();
    if (
      before.resource.status !== 'ready' ||
      before.removal ||
      before.queue.some(
        (entry) => entry.status === 'failed' || entry.status === 'uncertain',
      )
    )
      return;
    const controller = new AbortController();
    operation.current = controller;
    const active = () =>
      scope.current === owner &&
      operation.current === controller &&
      !controller.signal.aborted;
    publish((state) => ({ ...state, busy: true, writing: true, notice: '' }));
    try {
      while (active()) {
        if (options.current.locked) break;
        const entry = read().queue.find(
          (candidate) => candidate.status === 'queued',
        );
        if (!entry) break;
        publish((state) => ({
          ...state,
          queue: state.queue.map((candidate) =>
            candidate.id === entry.id
              ? { ...candidate, status: 'uploading', message: '' }
              : candidate,
          ),
        }));
        try {
          await uploadGuestDraftPhoto(
            entry.file,
            owner.token,
            controller.signal,
          );
          if (!active()) return;
          // A validated success is never retried even if its following list read fails.
          publish((state) => ({
            ...state,
            queue: state.queue.filter((candidate) => candidate.id !== entry.id),
            notice:
              '사진을 추가했습니다. 최종 제출 전까지 사진을 삭제할 수 있습니다.',
          }));
          if (!(await readList(controller))) break;
        } catch (error: unknown) {
          if (!active()) return;
          if (isPhotoAccessError(error)) {
            rejectAccess();
            return;
          }
          const uncertain = isPhotoWriteUncertain(error);
          publish((state) => ({
            ...state,
            queue: state.queue.map((candidate) =>
              candidate.id === entry.id
                ? {
                    ...candidate,
                    status: uncertain ? 'uncertain' : 'failed',
                    checked: false,
                    message: uncertain
                      ? uncertainPhotoMessage
                      : photoFailureMessage(error),
                  }
                : candidate,
            ),
          }));
          break;
        }
      }
    } finally {
      if (operation.current === controller) {
        operation.current = null;
        publish((state) => ({ ...state, busy: false, writing: false }));
        if (deferredRead.current && scope.current === owner) {
          deferredRead.current = false;
          void refresh();
        }
      }
    }
  }, [owner, publish, read, readList, refresh, rejectAccess]);

  const uploadFiles = useCallback(
    (files: FileList | readonly File[]) => {
      const state = read();
      if (
        scope.current !== owner ||
        operation.current ||
        options.current.locked ||
        state.resource.status !== 'ready' ||
        state.removal ||
        state.queue.length
      )
        return;
      const selected = Array.from(files);
      if (!selected.length) return;
      const available = Math.max(
        0,
        state.resource.list.limits.maxPhotos - state.resource.list.items.length,
      );
      if (selected.length > available) {
        publish((value) => ({
          ...value,
          notice: `사진은 최대 ${state.resource.status === 'ready' ? state.resource.list.limits.maxPhotos : 40}장까지 추가할 수 있습니다. 지금은 ${available}장을 더 선택할 수 있습니다.`,
        }));
        return;
      }
      publish((value) => ({
        ...value,
        queue: selected.map((file) => ({
          id: ++counter.current,
          file,
          status: 'queued',
          message: '',
          checked: false,
        })),
        notice: '',
      }));
      void runQueue();
    },
    [owner, publish, read, runQueue],
  );

  const retry = useCallback(
    (id: number) => {
      if (
        scope.current !== owner ||
        operation.current ||
        options.current.locked ||
        read().resource.status !== 'ready'
      )
        return;
      const entry = read().queue.find((item) => item.id === id);
      // An unknown upload is never retried. Reconcile, dismiss it, and explicitly
      // choose a file again if the guest decides another upload is appropriate.
      if (entry?.status !== 'failed') return;
      publish((state) => ({
        ...state,
        queue: state.queue.map((item) =>
          item.id === id ? { ...item, status: 'queued', message: '' } : item,
        ),
      }));
      void runQueue();
    },
    [owner, publish, read, runQueue],
  );

  const dismiss = useCallback(
    (id: number) => {
      if (
        scope.current !== owner ||
        operation.current ||
        options.current.locked
      )
        return;
      const entry = read().queue.find((item) => item.id === id);
      if (
        !entry ||
        entry.status === 'uploading' ||
        (entry.status === 'uncertain' && !entry.checked)
      )
        return;
      publish((state) => ({
        ...state,
        queue: state.queue.filter((item) => item.id !== id),
      }));
    },
    [owner, publish, read],
  );

  const remove = useCallback(
    async (id: string) => {
      const state = read();
      if (
        scope.current !== owner ||
        operation.current ||
        options.current.locked ||
        state.resource.status !== 'ready' ||
        state.queue.length ||
        state.removal ||
        !state.resource.list.items.some((photo) => photo.id === id)
      )
        return;
      const controller = new AbortController();
      operation.current = controller;
      const active = () =>
        scope.current === owner &&
        operation.current === controller &&
        !controller.signal.aborted;
      publish((value) => ({ ...value, busy: true, writing: true, notice: '' }));
      try {
        await removeGuestDraftPhoto(id, owner.token, controller.signal);
        if (!active()) return;
        publish((value) => ({ ...value, notice: '사진을 삭제했습니다.' }));
        await readList(controller);
      } catch (error: unknown) {
        if (!active()) return;
        if (isPhotoAccessError(error)) rejectAccess();
        else if (isPhotoWriteUncertain(error))
          publish((value) => ({
            ...value,
            removal: { id, checked: false },
            notice:
              '사진 삭제 결과를 확인하지 못했습니다. 사진 목록을 다시 확인해 주세요.',
          }));
        else
          publish((value) => ({
            ...value,
            notice: photoFailureMessage(error),
          }));
      } finally {
        if (operation.current === controller) {
          operation.current = null;
          publish((value) => ({ ...value, busy: false, writing: false }));
          if (deferredRead.current && scope.current === owner) {
            deferredRead.current = false;
            void refresh();
          }
        }
      }
    },
    [owner, publish, read, readList, refresh, rejectAccess],
  );

  const acknowledgeRemoval = useCallback(() => {
    if (
      scope.current !== owner ||
      operation.current ||
      options.current.locked ||
      !read().removal?.checked
    )
      return;
    publish((value) => ({
      ...value,
      removal: null,
      notice:
        '현재 목록을 확인했습니다. 사진이 남아 있다면 삭제를 다시 선택할 수 있습니다.',
    }));
  }, [owner, publish, read]);

  const getPreview = useCallback(
    async (photo: GuestDraftPhotoDto, signal: AbortSignal) => {
      const state = read();
      if (
        scope.current !== owner ||
        signal.aborted ||
        state.resource.status !== 'ready' ||
        !state.resource.list.items.some((item) => item.id === photo.id)
      )
        throw new DOMException('Aborted', 'AbortError');
      const controller = new AbortController();
      previews.current.add(controller);
      const abort = () => controller.abort();
      signal.addEventListener('abort', abort, { once: true });
      try {
        const view = await getGuestDraftPhotoView(
          photo.id,
          owner.token,
          controller.signal,
        );
        if (scope.current !== owner || controller.signal.aborted)
          throw new DOMException('Aborted', 'AbortError');
        return view;
      } catch (error: unknown) {
        if (
          scope.current === owner &&
          !controller.signal.aborted &&
          isPhotoAccessError(error)
        )
          rejectAccess();
        throw error;
      } finally {
        signal.removeEventListener('abort', abort);
        previews.current.delete(controller);
      }
    },
    [owner, read, rejectAccess],
  );

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
    const restored = (event: PageTransitionEvent) => {
      if (event.persisted) {
        away = false;
        void refresh();
      }
    };
    window.addEventListener('blur', leave);
    window.addEventListener('focus', resume);
    window.addEventListener('pageshow', restored);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('blur', leave);
      window.removeEventListener('focus', resume);
      window.removeEventListener('pageshow', restored);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [refresh]);

  const state = result.owner === owner ? result.state : initialState();
  useEffect(() => {
    if (!state.writing && state.queue.length === 0 && !state.removal) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [state.writing, state.queue.length, state.removal]);
  return {
    ...state,
    items: state.resource.status === 'ready' ? state.resource.list.items : [],
    limits:
      state.resource.status === 'ready' ? state.resource.list.limits : null,
    locked,
    blocked:
      state.resource.status !== 'ready' ||
      state.queue.length > 0 ||
      state.removal !== null,
    uploadFiles,
    remove,
    refresh,
    retry,
    dismiss,
    continueQueue: runQueue,
    acknowledgeRemoval,
    getPreview,
  };
}

export type GuestDraftPhotosController = ReturnType<typeof useGuestDraftPhotos>;
