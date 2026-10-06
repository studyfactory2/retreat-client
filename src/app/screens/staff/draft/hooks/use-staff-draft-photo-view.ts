import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { getStaffDraftPhotoView } from '../../../../features/staff-draft-photos/staff-draft-photos-api';

export type StaffPhotoPreviewState =
  | { status: 'idle' | 'loading' | 'expired' | 'denied' }
  | { status: 'error'; message: string }
  | { status: 'ready'; url: string; expiresAt: string };
type ReadyPreview = Extract<StaffPhotoPreviewState, { status: 'ready' }>;
type Options = {
  token: string;
  draftId: string;
  photoId: string;
  draftExpiresAt: string;
  enabled: boolean;
  onAccessRejected: () => void;
};

export function useStaffDraftPhotoView({
  token,
  draftId,
  photoId,
  draftExpiresAt,
  enabled,
  onAccessRejected,
}: Options) {
  // Credentials own an in-memory session; neither tokens nor signed URLs are keys.
  const owner = useMemo(
    () => ({
      token,
      draftId,
      photoId,
      draftExpiresAt,
      initial: { status: 'idle' as const },
    }),
    [token, draftId, photoId, draftExpiresAt],
  );
  const scope = useRef<typeof owner | null>(owner);
  const options = useRef({ enabled, onAccessRejected });
  const request = useRef<AbortController | null>(null);
  const suspended = useRef(document.visibilityState === 'hidden');
  const [away, setAway] = useState(() => document.visibilityState === 'hidden');
  const current = useRef<StaffPhotoPreviewState>(owner.initial);
  const [result, setResult] = useState<{
    owner: typeof owner;
    preview: StaffPhotoPreviewState;
  }>();

  const publish = useCallback(
    (preview: StaffPhotoPreviewState) => {
      if (scope.current !== owner) return;
      current.current = preview;
      setResult({ owner, preview });
    },
    [owner],
  );

  const deny = useCallback(() => {
    if (scope.current !== owner) return;
    request.current?.abort();
    request.current = null;
    const notify = current.current.status !== 'denied';
    publish({ status: 'denied' });
    if (notify) options.current.onAccessRejected();
  }, [owner, publish]);

  const pause = useCallback(() => {
    if (scope.current !== owner) return;
    request.current?.abort();
    request.current = null;
    const previous = current.current;
    // Errors/expiry require deliberate retry. A previously usable preview may
    // request a fresh URL only after access is available again.
    if (
      previous.status === 'error' ||
      previous.status === 'expired' ||
      previous.status === 'denied'
    )
      return;
    publish({ status: 'idle' });
  }, [owner, publish]);

  useLayoutEffect(() => {
    scope.current = owner;
    current.current = { status: 'idle' };
    suspended.current = document.visibilityState === 'hidden';
    setAway(suspended.current);
    publish({ status: 'idle' });
    return () => {
      scope.current = null;
      request.current?.abort();
      request.current = null;
    };
  }, [owner, publish]);

  useLayoutEffect(() => {
    const previouslyEnabled = options.current.enabled;
    options.current = { enabled, onAccessRejected };
    if (!enabled) pause();
    else if (!previouslyEnabled && current.current.status === 'denied') {
      publish({ status: 'idle' });
    }
  }, [enabled, onAccessRejected, pause, publish]);

  const load = useCallback(async () => {
    if (
      scope.current !== owner ||
      !options.current.enabled ||
      suspended.current ||
      request.current ||
      current.current.status === 'denied'
    )
      return;
    const draftDeadline = Date.parse(owner.draftExpiresAt);
    if (!Number.isFinite(draftDeadline) || draftDeadline <= Date.now()) {
      deny();
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    const active = () =>
      scope.current === owner &&
      request.current === controller &&
      !controller.signal.aborted &&
      options.current.enabled &&
      !suspended.current;
    publish({ status: 'loading' });
    try {
      const view = await getStaffDraftPhotoView(
        owner.photoId,
        owner.token,
        controller.signal,
      );
      if (!active()) return;
      if (draftDeadline <= Date.now()) {
        deny();
        return;
      }
      const deadline = Math.min(Date.parse(view.expiresAt), draftDeadline);
      publish(
        !Number.isFinite(deadline) || deadline <= Date.now()
          ? { status: 'expired' }
          : {
              status: 'ready',
              url: view.url,
              expiresAt: new Date(deadline).toISOString(),
            },
      );
    } catch (error: unknown) {
      if (!active()) return;
      const failure = error instanceof ApiRequestError ? error : null;
      if (
        failure?.status === 401 ||
        failure?.status === 403 ||
        failure?.code === 'INVALID_DRAFT_ACCESS'
      ) {
        deny();
        return;
      }
      publish({
        status: 'error',
        message:
          failure?.status === 429
            ? '사진 요청이 많습니다. 잠시 후 다시 열어 주세요.'
            : failure?.status === 404
              ? '사진을 찾을 수 없습니다. 첨부 사진 목록을 다시 확인해 주세요.'
              : '사진을 불러오지 못했습니다. 다시 열어 주세요.',
      });
    } finally {
      if (request.current === controller) request.current = null;
    }
  }, [owner, deny, publish]);

  const imageFailed = useCallback(
    (preview: ReadyPreview) => {
      if (
        scope.current !== owner ||
        current.current !== preview ||
        !options.current.enabled
      )
        return;
      if (Date.parse(owner.draftExpiresAt) <= Date.now()) {
        deny();
        return;
      }
      publish(
        Date.parse(preview.expiresAt) <= Date.now()
          ? { status: 'expired' }
          : {
              status: 'error',
              message:
                '사진을 표시하지 못했습니다. 미리보기를 다시 열어 주세요.',
            },
      );
    },
    [owner, deny, publish],
  );

  useEffect(() => {
    const leave = () => {
      suspended.current = true;
      setAway(true);
      pause();
    };
    const resume = () => {
      if (document.visibilityState === 'hidden') return;
      suspended.current = false;
      setAway(false);
    };
    const visibility = () =>
      document.visibilityState === 'hidden' ? leave() : resume();
    const restored = (event: PageTransitionEvent) => {
      if (event.persisted) resume();
    };
    window.addEventListener('blur', leave);
    window.addEventListener('focus', resume);
    window.addEventListener('pagehide', leave);
    window.addEventListener('pageshow', restored);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('blur', leave);
      window.removeEventListener('focus', resume);
      window.removeEventListener('pagehide', leave);
      window.removeEventListener('pageshow', restored);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [pause]);

  const preview = result?.owner === owner ? result.preview : owner.initial;
  useEffect(() => {
    if (preview.status !== 'ready') return;
    let timer: ReturnType<typeof setTimeout>;
    const expire = () => {
      if (scope.current !== owner || current.current !== preview) return;
      if (Date.parse(owner.draftExpiresAt) <= Date.now()) {
        deny();
        return;
      }
      const remaining = Date.parse(preview.expiresAt) - Date.now();
      if (remaining <= 0) {
        publish({ status: 'expired' });
      } else timer = setTimeout(expire, Math.min(remaining, 2_147_483_647));
    };
    expire();
    return () => clearTimeout(timer);
  }, [owner, preview, deny, publish]);

  const available = enabled && !away;
  const visible: StaffPhotoPreviewState = available ? preview : owner.initial;
  return {
    preview: visible,
    canLoad:
      available && preview.status !== 'loading' && preview.status !== 'denied',
    canAutoLoad: available && preview.status === 'idle',
    load,
    imageFailed,
  };
}

export type StaffDraftPhotoViewController = ReturnType<
  typeof useStaffDraftPhotoView
>;
