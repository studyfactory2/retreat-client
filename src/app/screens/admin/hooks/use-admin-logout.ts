import { useLayoutEffect, useRef } from 'react';
import { useNavigationActions } from '../../../core/router/navigation/use-navigation-guard';
import { useAdminSession } from '../../../core/session/use-admin-session';

export function useAdminLogout() {
  const session = useAdminSession();
  const current = useRef(session);
  useLayoutEffect(() => {
    current.current = session;
  }, [session]);
  const { requestAction } = useNavigationActions();
  const cancel = useRef<(() => void) | undefined>(undefined);
  const token =
    session.state.status === 'authenticated' ? session.state.token : null;
  useLayoutEffect(() => () => cancel.current?.(), [token]);
  return () => {
    cancel.current?.();
    cancel.current = requestAction(() => {
      const latest = current.current;
      // An old confirmation must never sign out a replacement session.
      if (
        latest.state.status === 'authenticated' &&
        latest.state.token === token
      )
        latest.logout();
    });
  };
}
