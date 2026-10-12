import { useCallback, useRef, useState } from 'react';
import { useAdminNavigationGuard } from '../../hooks/use-admin-navigation-guard';

export interface StayLinkNavigationGuard {
  isBusy: () => boolean;
  hasReceipt: () => boolean;
  hasPendingChanges: () => boolean;
}

export function useStayLinkNavigation() {
  const guard = useRef<StayLinkNavigationGuard | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const register = useCallback((next: StayLinkNavigationGuard | null) => {
    guard.current = next;
    setBusy(next?.isBusy() ?? false);
  }, []);

  const runConfirmed = useAdminNavigationGuard(
    () => guard.current?.hasPendingChanges() ?? false,
  );

  return {
    busy,
    pending: pending !== null,
    register,
    request: (run: () => void) => {
      if (pending || guard.current?.isBusy()) return;
      if (!guard.current?.hasReceipt()) {
        setPending(null);
        return run();
      }
      trigger.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      setPending(() => run);
    },
    keep: () => {
      setPending(null);
      requestAnimationFrame(() => {
        if (trigger.current?.isConnected) trigger.current.focus();
      });
    },
    proceed: () => {
      if (guard.current?.isBusy()) return;
      setPending(null);
      if (pending) runConfirmed(pending);
    },
  };
}
