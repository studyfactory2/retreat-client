import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import {
  useNavigationActions,
  useNavigationGuard,
} from '../../../core/router/navigation/use-navigation-guard';

// Read the current editor and request state, including synchronous mutation refs.
export function useAdminNavigationGuard(
  pending: boolean | (() => boolean),
): (operation: () => void) => void {
  const current = useRef(pending);
  useLayoutEffect(() => {
    current.current = pending;
  }, [pending]);
  const hasPendingWork = useCallback(
    () =>
      typeof current.current === 'function'
        ? current.current()
        : current.current,
    [],
  );
  useNavigationGuard(hasPendingWork);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!hasPendingWork()) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasPendingWork]);
  return useNavigationActions().runConfirmed;
}
