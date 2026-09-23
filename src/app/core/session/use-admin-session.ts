import { useContext, useSyncExternalStore } from 'react';
import { AdminSessionContext } from './admin-session-context';

export function useAdminSession() {
  const store = useContext(AdminSessionContext);
  if (!store) throw new Error('AdminSessionProvider is required.');
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return {
    state,
    signIn: store.signIn,
    retry: store.retry,
    logout: store.logout,
    rejectSession: store.rejectSession,
  };
}
