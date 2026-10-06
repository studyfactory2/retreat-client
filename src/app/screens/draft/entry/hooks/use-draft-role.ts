import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { getPrivateDraftRole } from '../../../../features/draft-entry/draft-entry-api';

type RoleState =
  | { status: 'loading' }
  | { status: 'ready'; role: 'guest' | 'staff' }
  | { status: 'error'; denied: boolean };
const loadingRole: RoleState = { status: 'loading' };

export function useDraftRole(token: string | null) {
  const owner = useMemo(() => ({ token }), [token]);
  const [attempt, setAttempt] = useState(0);
  const [owned, setOwned] = useState<{
    owner: typeof owner;
    attempt: number;
    state: RoleState;
  } | null>(null);
  const latest = useRef<typeof owner | null>(owner);
  useLayoutEffect(() => {
    latest.current = owner;
    return () => {
      latest.current = null;
    };
  }, [owner]);
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    let active = true;
    const suspend = () => {
      active = false;
      controller.abort();
    };
    window.addEventListener('pagehide', suspend);
    void getPrivateDraftRole(token, controller.signal).then(
      (role) => {
        if (active && latest.current === owner)
          setOwned({ owner, attempt, state: { status: 'ready', role } });
      },
      (error: unknown) => {
        if (active && latest.current === owner)
          setOwned({
            owner,
            attempt,
            state: {
              status: 'error',
              denied:
                error instanceof ApiRequestError &&
                (error.status === 401 || error.status === 403),
            },
          });
      },
    );
    return () => {
      active = false;
      controller.abort();
      window.removeEventListener('pagehide', suspend);
    };
  }, [token, owner, attempt]);
  const state: RoleState =
    owned?.owner === owner && owned.attempt === attempt
      ? owned.state
      : loadingRole;
  const displayed = useRef(state);
  useLayoutEffect(() => {
    displayed.current = state;
  }, [state]);
  useEffect(() => {
    if (!token) return;
    let away = document.visibilityState === 'hidden';
    const leave = () => {
      away = true;
    };
    const resume = () => {
      if (!away || document.visibilityState === 'hidden') return;
      away = false;
      // Mounted editors own revalidation and must retain unsaved input.
      if (displayed.current.status !== 'ready')
        setAttempt((value) => value + 1);
    };
    const visibility = () =>
      document.visibilityState === 'hidden' ? leave() : resume();
    const restored = (event: PageTransitionEvent) => {
      if (event.persisted) {
        away = true;
        resume();
      }
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
  }, [token]);
  return {
    state,
    retry: () => {
      if (
        latest.current !== owner ||
        owner.token === null ||
        displayed.current.status === 'ready'
      )
        return;
      setAttempt((value) => value + 1);
    },
  };
}
