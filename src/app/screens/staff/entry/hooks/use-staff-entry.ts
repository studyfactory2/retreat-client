import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { getStaffQrContext } from '../../../../features/staff-entry/staff-entry-api';
import type { StaffQrContextDto } from '../../../../features/staff-entry/staff-entry.types';

type Resource =
  | { status: 'loading' }
  | { status: 'ready'; data: StaffQrContextDto }
  | { status: 'error'; kind: 'unavailable' | 'request'; message: string };

export function useStaffEntry(token: string | null) {
  // The credential is an in-memory owner, never a serialized or persisted key.
  const owner = useMemo(() => ({ token }), [token]);
  const scope = useRef<typeof owner | null>(owner);
  const request = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    owner: typeof owner;
    revision: number;
    resource: Resource;
  }>();

  useLayoutEffect(() => {
    scope.current = owner;
    return () => {
      scope.current = null;
      request.current?.abort();
      request.current = null;
    };
  }, [owner]);

  const refresh = useCallback(() => {
    if (scope.current !== owner || owner.token === null) return;
    request.current?.abort();
    generation.current += 1;
    setRevision(generation.current);
  }, [owner]);

  useEffect(() => {
    if (owner.token === null) return;
    const credential = owner.token;
    const controller = new AbortController();
    request.current = controller;
    const isCurrent = () =>
      !controller.signal.aborted &&
      request.current === controller &&
      scope.current === owner &&
      generation.current === revision;

    async function load() {
      try {
        const data = await getStaffQrContext(credential, controller.signal);
        if (!isCurrent()) return;
        setResult({ owner, revision, resource: { status: 'ready', data } });
      } catch (error: unknown) {
        if (!isCurrent()) return;
        const failure = error instanceof ApiRequestError ? error : null;
        const unavailable =
          failure?.status === 401 ||
          failure?.status === 403 ||
          failure?.code === 'INVALID_QR';
        setResult({
          owner,
          revision,
          resource: {
            status: 'error',
            kind: unavailable ? 'unavailable' : 'request',
            message: unavailable
              ? '이 직원용 QR을 사용할 수 없습니다. 안내받은 QR을 다시 확인하거나 관리자에게 문의해 주세요.'
              : failure?.status === 429
                ? '요청이 많습니다. 잠시 후 다시 시도해 주세요.'
                : '직원용 안내를 불러오지 못했습니다. 다시 시도해 주세요.',
          },
        });
      } finally {
        if (request.current === controller) request.current = null;
      }
    }
    void load();
    return () => {
      controller.abort();
      if (request.current === controller) request.current = null;
    };
  }, [owner, revision]);

  useEffect(() => {
    if (token === null) return;
    let wasAway = document.visibilityState === 'hidden';
    const leave = () => {
      wasAway = true;
    };
    const resume = () => {
      if (!wasAway || document.visibilityState === 'hidden') return;
      wasAway = false;
      refresh();
    };
    const visibilityChanged = () => {
      if (document.visibilityState === 'hidden') leave();
      else resume();
    };
    const pageRestored = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      wasAway = false;
      // Always replace pre-freeze work, even if its request is still pending.
      refresh();
    };
    window.addEventListener('blur', leave);
    window.addEventListener('focus', resume);
    window.addEventListener('pagehide', leave);
    window.addEventListener('pageshow', pageRestored);
    document.addEventListener('visibilitychange', visibilityChanged);
    return () => {
      window.removeEventListener('blur', leave);
      window.removeEventListener('focus', resume);
      window.removeEventListener('pagehide', leave);
      window.removeEventListener('pageshow', pageRestored);
      document.removeEventListener('visibilitychange', visibilityChanged);
    };
  }, [token, refresh]);

  const resource: Resource =
    result?.owner === owner && result.revision === revision
      ? result.resource
      : { status: 'loading' };
  return { resource, refresh };
}
