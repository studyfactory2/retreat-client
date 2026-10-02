import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  getGuestIssuePhotoView,
  removeGuestIssuePhoto,
  uploadGuestIssuePhoto,
} from '../../../../features/guest-issues/guest-issue-photos-api';
import { GUEST_ISSUE_MAX_PHOTOS } from '../../../../features/guest-issues/guest-issues-validation';
import type { GuestIssuePhotoViewDto } from '../../../../features/guest-issues/guest-issues.types';
import {
  isIssuePhotoOutcomeUnknown,
  isIssuePhotoQrRejected,
  isIssuePhotoUnavailable,
  issuePhotoFailure,
  issuePhotoRemoveUnknown,
  issuePhotoUploadUnknown,
  type GuestIssueManagedPhoto,
  type GuestIssueQueuedPhoto,
  type GuestIssueReadyPhotoClaim,
} from '../model/guest-issue-photo-model';

const maximumPhotos = GUEST_ISSUE_MAX_PHOTOS;
type PhotoState = {
  photos: GuestIssueManagedPhoto[];
  queue: GuestIssueQueuedPhoto[];
  busy: boolean;
  unavailable: boolean;
  notice: string;
};
type PhotoOperation = { controller: AbortController } & (
  { kind: 'upload'; queueId: number } | { kind: 'remove'; photoId: string }
);
type Options = {
  qrToken: string | null;
  propertyId: string | null;
  disabled: boolean;
  onQrRejected: () => void;
};
const emptyState = (): PhotoState => ({
  photos: [],
  queue: [],
  busy: false,
  unavailable: false,
  notice: '',
});

export function useGuestIssuePhotos({
  qrToken,
  propertyId,
  disabled,
  onQrRejected,
}: Options) {
  const owner = useMemo(() => ({ qrToken, propertyId }), [qrToken, propertyId]);
  const scope = useRef<typeof owner | null>(owner);
  const options = useRef({ disabled, onQrRejected });
  const operation = useRef<PhotoOperation | null>(null);
  const previews = useRef(new Set<AbortController>());
  const counter = useRef(0);
  const current = useRef<{ owner: typeof owner; state: PhotoState } | null>(
    null,
  );
  const [result, setResult] = useState<{
    owner: typeof owner;
    state: PhotoState;
  } | null>(null);
  // Clear the previous session state as soon as its owner changes. The next
  // render sees null, so this conditional does not repeat.
  if (result !== null && result.owner !== owner) setResult(null);

  const read = useCallback(
    () =>
      current.current?.owner === owner ? current.current.state : emptyState(),
    [owner],
  );
  const publish = useCallback(
    (change: (value: PhotoState) => PhotoState) => {
      if (scope.current !== owner) return;
      const next = { owner, state: change(read()) };
      current.current = next;
      setResult(next);
    },
    [owner, read],
  );

  useLayoutEffect(() => {
    options.current = { disabled, onQrRejected };
    if (disabled) for (const request of previews.current) request.abort();
  }, [disabled, onQrRejected]);
  useLayoutEffect(() => {
    scope.current = owner;
    current.current = null;
    const requests = previews.current;
    return () => {
      scope.current = null;
      operation.current?.controller.abort();
      operation.current = null;
      for (const request of requests) request.abort();
      requests.clear();
      current.current = null;
    };
  }, [owner]);

  const rejectQr = useCallback(() => {
    if (scope.current !== owner) return;
    operation.current?.controller.abort();
    operation.current = null;
    for (const request of previews.current) request.abort();
    publish(() => ({
      ...emptyState(),
      unavailable: true,
      notice: '이용객 QR의 접근 상태를 다시 확인해 주세요.',
    }));
    options.current.onQrRejected();
  }, [owner, publish]);

  const expirePhotos = useCallback(() => {
    const now = Date.now();
    const state = read();
    if (
      !state.photos.some(
        (entry) => entry.token !== null && Date.parse(entry.expiresAt) <= now,
      )
    )
      return;
    publish((value) => ({
      ...value,
      photos: value.photos.map((entry) =>
        entry.token !== null && Date.parse(entry.expiresAt) <= now
          ? {
              ...entry,
              token: null,
              status: 'expired',
              message:
                '사진의 사용 기간이 만료되었습니다. 목록에서 제외하고 필요하면 다시 선택해 주세요.',
            }
          : entry,
      ),
    }));
  }, [publish, read]);

  const markUnavailable = useCallback(
    (id: string) => {
      publish((value) => ({
        ...value,
        photos: value.photos.map((entry) =>
          entry.photo.id === id
            ? {
                ...entry,
                token: null,
                status: 'unavailable',
                message:
                  '이 사진을 사용할 수 없습니다. 목록에서 제외하고 필요하면 다시 선택해 주세요.',
              }
            : entry,
        ),
      }));
    },
    [publish],
  );

  const runQueue = useCallback(async () => {
    const state = read();
    if (
      scope.current !== owner ||
      !owner.qrToken ||
      !owner.propertyId ||
      operation.current ||
      options.current.disabled ||
      state.unavailable ||
      state.photos.some((entry) => entry.status !== 'ready') ||
      state.queue.some(
        (entry) => entry.status === 'uncertain' || entry.status === 'failed',
      )
    )
      return;
    while (scope.current === owner && !options.current.disabled) {
      if (
        read().photos.some(
          (photo) =>
            photo.status !== 'ready' ||
            Date.parse(photo.expiresAt) <= Date.now(),
        )
      )
        return;
      const entry = read().queue.find((item) => item.status === 'queued');
      if (!entry) return;
      const job: PhotoOperation = {
        kind: 'upload',
        queueId: entry.id,
        controller: new AbortController(),
      };
      operation.current = job;
      const active = () =>
        scope.current === owner &&
        operation.current === job &&
        !job.controller.signal.aborted;
      publish((value) => ({
        ...value,
        busy: true,
        notice: '',
        queue: value.queue.map((item) =>
          item.id === entry.id
            ? { ...item, status: 'uploading', message: '' }
            : item,
        ),
      }));
      let failed = false;
      try {
        const uploaded = await uploadGuestIssuePhoto(
          entry.file,
          owner.qrToken,
          job.controller.signal,
        );
        if (!active()) return;
        if (read().photos.some((entry) => entry.photo.id === uploaded.photo.id))
          throw new Error('Upload response repeats an existing photo');
        const expired = Date.parse(uploaded.expiresAt) <= Date.now();
        publish((value) => ({
          ...value,
          photos: [
            ...value.photos,
            {
              photo: uploaded.photo,
              token: expired ? null : uploaded.token,
              expiresAt: uploaded.expiresAt,
              status: expired ? 'expired' : 'ready',
              message: expired
                ? '사진 사용 기간이 만료되었습니다. 목록에서 제외해 주세요.'
                : '',
            },
          ],
          queue: value.queue.filter((item) => item.id !== entry.id),
          notice:
            '사진을 추가했습니다. 이 창에서 신고를 마치면 함께 전달됩니다.',
        }));
        if (expired) failed = true;
      } catch (error: unknown) {
        if (!active()) return;
        failed = true;
        if (isIssuePhotoQrRejected(error)) {
          rejectQr();
          return;
        }
        const unknown = isIssuePhotoOutcomeUnknown(error);
        publish((value) => ({
          ...value,
          queue: value.queue.map((item) =>
            item.id === entry.id
              ? {
                  ...item,
                  status: unknown ? 'uncertain' : 'failed',
                  message: unknown
                    ? issuePhotoUploadUnknown
                    : issuePhotoFailure(error),
                }
              : item,
          ),
        }));
      } finally {
        if (operation.current === job) {
          operation.current = null;
          publish((value) => ({ ...value, busy: false }));
        }
      }
      if (failed) return;
    }
  }, [owner, publish, read, rejectQr]);

  const uploadFiles = useCallback(
    (files: FileList | readonly File[]) => {
      const state = read();
      if (
        scope.current !== owner ||
        !owner.qrToken ||
        !owner.propertyId ||
        options.current.disabled ||
        operation.current ||
        state.unavailable ||
        state.queue.length ||
        state.photos.some((entry) => entry.status !== 'ready')
      )
        return;
      const selected = Array.from(files);
      if (!selected.length) return;
      if (selected.length + state.photos.length > maximumPhotos) {
        publish((value) => ({
          ...value,
          notice: `사진은 최대 ${maximumPhotos}장까지 첨부할 수 있습니다. 지금은 ${maximumPhotos - state.photos.length}장을 더 선택할 수 있습니다.`,
        }));
        return;
      }
      publish((value) => ({
        ...value,
        notice: '',
        queue: selected.map((file) => ({
          id: ++counter.current,
          file,
          status: 'queued',
          message: '',
        })),
      }));
      void runQueue();
    },
    [owner, publish, read, runQueue],
  );

  const retryUpload = useCallback(
    (id: number) => {
      if (
        scope.current !== owner ||
        options.current.disabled ||
        operation.current ||
        read().queue.find((item) => item.id === id)?.status !== 'failed'
      )
        return;
      publish((value) => ({
        ...value,
        queue: value.queue.map((item) =>
          item.id === id ? { ...item, status: 'queued', message: '' } : item,
        ),
      }));
      void runQueue();
    },
    [owner, publish, read, runQueue],
  );

  const dismissQueued = useCallback(
    (id: number, acknowledgeUnknown = false) => {
      const entry = read().queue.find((item) => item.id === id);
      if (
        scope.current !== owner ||
        options.current.disabled ||
        operation.current ||
        !entry ||
        entry.status === 'uploading' ||
        (entry.status === 'uncertain' && !acknowledgeUnknown)
      )
        return;
      publish((value) => ({
        ...value,
        queue: value.queue.filter((item) => item.id !== id),
        notice:
          entry.status === 'uncertain'
            ? '결과를 알 수 없는 선택을 포기했습니다. 그 사진은 이 신고에 첨부되지 않습니다. 필요하면 파일을 새로 선택해 주세요.'
            : value.notice,
      }));
    },
    [owner, publish, read],
  );

  const remove = useCallback(
    async (id: string) => {
      const state = read();
      const entry = state.photos.find((item) => item.photo.id === id);
      if (
        scope.current !== owner ||
        !owner.qrToken ||
        !owner.propertyId ||
        options.current.disabled ||
        operation.current ||
        state.unavailable ||
        state.queue.length ||
        !entry ||
        !entry.token ||
        (entry.status !== 'ready' && entry.status !== 'remove-uncertain')
      )
        return;
      if (Date.parse(entry.expiresAt) <= Date.now()) {
        expirePhotos();
        return;
      }
      const retry = entry.status === 'remove-uncertain';
      const job: PhotoOperation = {
        kind: 'remove',
        photoId: id,
        controller: new AbortController(),
      };
      operation.current = job;
      const active = () =>
        scope.current === owner &&
        operation.current === job &&
        !job.controller.signal.aborted;
      publish((value) => ({ ...value, busy: true, notice: '' }));
      try {
        await removeGuestIssuePhoto(
          id,
          entry.token,
          owner.qrToken,
          job.controller.signal,
        );
        if (!active()) return;
        publish((value) => ({
          ...value,
          photos: value.photos.filter((item) => item.photo.id !== id),
          notice: '사진을 삭제했습니다.',
        }));
      } catch (error: unknown) {
        if (!active()) return;
        if (isIssuePhotoQrRejected(error)) {
          rejectQr();
          return;
        }
        if (isIssuePhotoUnavailable(error)) {
          markUnavailable(id);
          return;
        }
        if (retry || isIssuePhotoOutcomeUnknown(error)) {
          publish((value) => ({
            ...value,
            photos: value.photos.map((item) =>
              item.photo.id === id
                ? {
                    ...item,
                    status: 'remove-uncertain',
                    message: issuePhotoRemoveUnknown,
                  }
                : item,
            ),
          }));
        } else
          publish((value) => ({ ...value, notice: issuePhotoFailure(error) }));
      } finally {
        if (operation.current === job) {
          operation.current = null;
          publish((value) => ({ ...value, busy: false }));
        }
      }
    },
    [expirePhotos, markUnavailable, owner, publish, read, rejectQr],
  );

  const discardUnavailable = useCallback(
    (id: string) => {
      const entry = read().photos.find((item) => item.photo.id === id);
      if (
        scope.current !== owner ||
        options.current.disabled ||
        operation.current ||
        !entry ||
        (entry.status !== 'expired' && entry.status !== 'unavailable')
      )
        return;
      publish((value) => ({
        ...value,
        photos: value.photos.filter((item) => item.photo.id !== id),
        notice: '사용할 수 없는 사진을 이 신고 목록에서 제외했습니다.',
      }));
    },
    [owner, publish, read],
  );

  const getPreview = useCallback(
    async (
      id: string,
      signal: AbortSignal,
    ): Promise<GuestIssuePhotoViewDto> => {
      const entry = read().photos.find((item) => item.photo.id === id);
      if (
        scope.current !== owner ||
        !owner.qrToken ||
        !owner.propertyId ||
        options.current.disabled ||
        signal.aborted ||
        !entry ||
        entry.status !== 'ready' ||
        !entry.token
      )
        throw new DOMException('Request cancelled', 'AbortError');
      if (Date.parse(entry.expiresAt) <= Date.now()) {
        expirePhotos();
        throw new DOMException('Request cancelled', 'AbortError');
      }
      const controller = new AbortController();
      previews.current.add(controller);
      const abort = () => controller.abort();
      signal.addEventListener('abort', abort, { once: true });
      try {
        const view = await getGuestIssuePhotoView(
          id,
          entry.token,
          owner.qrToken,
          controller.signal,
        );
        if (
          scope.current !== owner ||
          options.current.disabled ||
          controller.signal.aborted
        )
          throw new DOMException('Request cancelled', 'AbortError');
        if (view.expiresAt > entry.expiresAt)
          throw new Error('Photo view expiry exceeds claim expiry');
        return view;
      } catch (error: unknown) {
        if (scope.current === owner && !controller.signal.aborted) {
          if (isIssuePhotoQrRejected(error)) rejectQr();
          else if (isIssuePhotoUnavailable(error)) markUnavailable(id);
        }
        throw error;
      } finally {
        signal.removeEventListener('abort', abort);
        previews.current.delete(controller);
      }
    },
    [expirePhotos, markUnavailable, owner, read, rejectQr],
  );

  const getReadyClaims = useCallback((): GuestIssueReadyPhotoClaim[] | null => {
    const state = read();
    if (
      scope.current !== owner ||
      !owner.qrToken ||
      !owner.propertyId ||
      operation.current ||
      state.unavailable ||
      state.queue.length ||
      state.photos.some(
        (entry) =>
          entry.status !== 'ready' ||
          !entry.token ||
          Date.parse(entry.expiresAt) <= Date.now(),
      )
    )
      return null;
    return state.photos.map((entry) => ({
      id: entry.photo.id,
      token: entry.token!,
      expiresAt: entry.expiresAt,
    }));
  }, [owner, read]);

  const clear = useCallback(() => {
    if (scope.current !== owner) return;
    operation.current?.controller.abort();
    operation.current = null;
    for (const request of previews.current) request.abort();
    publish(() => emptyState());
  }, [owner, publish]);

  const state = result?.owner === owner ? result.state : emptyState();
  const nextExpiry = state.photos
    .filter((entry) => entry.token !== null)
    .reduce<string | null>(
      (soonest, entry) =>
        soonest === null || entry.expiresAt < soonest
          ? entry.expiresAt
          : soonest,
      null,
    );
  useEffect(() => {
    if (!nextExpiry) return;
    const timer = setTimeout(
      expirePhotos,
      Math.max(0, Math.min(2_147_483_647, Date.parse(nextExpiry) - Date.now())),
    );
    return () => clearTimeout(timer);
  }, [expirePhotos, nextExpiry]);

  useEffect(() => {
    const resume = () => {
      if (document.visibilityState !== 'hidden') expirePhotos();
    };
    const restored = (event: PageTransitionEvent) => {
      if (event.persisted) {
        const job = operation.current;
        if (job) {
          job.controller.abort();
          operation.current = null;
          publish((value) => ({
            ...value,
            busy: false,
            queue:
              job.kind === 'upload'
                ? value.queue.map((entry) =>
                    entry.id === job.queueId
                      ? {
                          ...entry,
                          status: 'uncertain',
                          message: issuePhotoUploadUnknown,
                        }
                      : entry,
                  )
                : value.queue,
            photos:
              job.kind === 'remove'
                ? value.photos.map((entry) =>
                    entry.photo.id === job.photoId
                      ? {
                          ...entry,
                          status: 'remove-uncertain',
                          message: issuePhotoRemoveUnknown,
                        }
                      : entry,
                  )
                : value.photos,
          }));
        }
      }
      resume();
    };
    window.addEventListener('focus', resume);
    window.addEventListener('pageshow', restored);
    document.addEventListener('visibilitychange', resume);
    return () => {
      window.removeEventListener('focus', resume);
      window.removeEventListener('pageshow', restored);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [expirePhotos, publish]);

  const dirty = state.photos.length > 0 || state.queue.length > 0 || state.busy;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  return {
    ...state,
    disabled,
    dirty,
    hasPhotos: state.photos.length > 0,
    maxPhotos: maximumPhotos,
    blocked:
      !qrToken ||
      !propertyId ||
      state.unavailable ||
      state.busy ||
      state.queue.length > 0 ||
      state.photos.some((entry) => entry.status !== 'ready'),
    uploadFiles,
    retryUpload,
    dismissQueued,
    continueQueue: runQueue,
    remove,
    retryRemove: remove,
    discardUnavailable,
    getPreview,
    getReadyClaims,
    clear,
  };
}

export type GuestIssuePhotosController = ReturnType<typeof useGuestIssuePhotos>;
