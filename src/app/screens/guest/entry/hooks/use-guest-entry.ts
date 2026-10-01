import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import {
  getGuestEntryContext,
  getGuestPropertyGuide,
} from '../../../../features/guest-entry/guest-entry-api';
import type {
  GuestAccessKind,
  GuestEntryContext,
  GuestPropertyGuideDto,
} from '../../../../features/guest-entry/guest-entry.types';
import type { GuestView } from '../model/guest-entry-model';

type Resource =
  | { status: 'loading' }
  | {
      status: 'ready';
      data: { entry: GuestEntryContext; guide?: GuestPropertyGuideDto };
    }
  | { status: 'error'; kind: 'unavailable' | 'request'; message: string };

function unavailable(kind: GuestAccessKind): Resource {
  return {
    status: 'error',
    kind: 'unavailable',
    message:
      kind === 'stay'
        ? '이용 링크를 사용할 수 없습니다. 관리자에게 새 링크를 요청해 주세요.'
        : '이 QR 링크를 사용할 수 없습니다. 안내받은 QR을 다시 확인하거나 관리자에게 문의해 주세요.',
  };
}

function expired(entry: GuestEntryContext): boolean {
  return entry.kind === 'stay' && Date.parse(entry.context.expiresAt) <= Date.now();
}

export function useGuestEntry(
  kind: GuestAccessKind,
  token: string | null,
  view: GuestView,
) {
  // Credentials are direct in-memory ownership values, never serialized keys.
  const owner = useMemo(() => ({ kind, token, view }), [kind, token, view]);
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
        const entry = await getGuestEntryContext(owner.kind, credential, controller.signal);
        if (!isCurrent()) return;
        if (expired(entry)) {
          setResult({ owner, revision, resource: unavailable(owner.kind) });
          return;
        }
        const guide = owner.view === 'guide'
          ? await getGuestPropertyGuide(owner.kind, credential, controller.signal)
          : undefined;
        if (!isCurrent()) return;
        if (guide && guide.property.id !== entry.context.property.id) {
          setResult({
            owner,
            revision,
            resource: {
              status: 'error',
              kind: 'request',
              message: '휴양소 이용 안내를 확인하지 못했습니다. 다시 불러와 주세요.',
            },
          });
          return;
        }
        setResult({
          owner,
          revision,
          resource: expired(entry)
            ? unavailable(owner.kind)
            : { status: 'ready', data: { entry, ...(guide ? { guide } : {}) } },
        });
      } catch (error: unknown) {
        if (!isCurrent()) return;
        const status = error instanceof ApiRequestError ? error.status : null;
        setResult({
          owner,
          revision,
          resource: status === 401 || status === 403
            ? unavailable(owner.kind)
            : {
                status: 'error',
                kind: 'request',
                message: status === 429
                  ? '요청이 많습니다. 잠시 후 다시 시도해 주세요.'
                  : '이용 정보를 불러오지 못했습니다. 다시 시도해 주세요.',
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
      // A frozen request may have authorized access before the link changed.
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

  const resource: Resource = result?.owner === owner && result.revision === revision
    ? result.resource
    : { status: 'loading' };
  const expiresAt = resource.status === 'ready' && resource.data.entry.kind === 'stay'
    ? resource.data.entry.context.expiresAt
    : null;

  useEffect(() => {
    if (expiresAt === null) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const delay = Math.max(0, Date.parse(expiresAt) - Date.now());
      timer = setTimeout(() => {
        if (scope.current !== owner || generation.current !== revision) return;
        if (Date.parse(expiresAt) > Date.now()) schedule();
        else setResult({ owner, revision, resource: unavailable(owner.kind) });
      }, Math.min(delay, 2_147_483_647));
    };
    schedule();
    return () => clearTimeout(timer);
  }, [expiresAt, owner, revision]);

  return { resource, refresh };
}
