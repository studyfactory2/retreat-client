import { useCallback, useEffect, useRef, useState } from 'react';
import { useAdminNavigationGuard } from '../../hooks/use-admin-navigation-guard';
import type { StayLinkNavigationGuard } from './use-stay-link-navigation';

// Local panel transitions need the same protection as leaving the route.
export function useStayDetailNavigation() {
  const guard = useRef<StayLinkNavigationGuard | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{
    run: () => void;
    receipt: boolean;
  } | null>(null);
  const register = useCallback((value: StayLinkNavigationGuard | null) => {
    guard.current = value;
    setBusy(value?.isBusy() ?? false);
  }, []);
  const runConfirmed = useAdminNavigationGuard(
    () => guard.current?.hasPendingChanges() ?? false,
  );
  useEffect(
    () => () => {
      guard.current = null;
    },
    [],
  );

  function request(run: () => void) {
    if (pending || guard.current?.isBusy()) return;
    if (!guard.current?.hasPendingChanges() && !guard.current?.hasReceipt()) {
      run();
      return;
    }
    trigger.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setPending({ run, receipt: guard.current?.hasReceipt() ?? false });
  }

  return {
    register,
    busy,
    pending,
    request,
    keep: () => {
      setPending(null);
      requestAnimationFrame(() => {
        if (trigger.current?.isConnected) trigger.current.focus();
      });
    },
    proceed: () => {
      if (!pending || guard.current?.isBusy()) return;
      setPending(null);
      runConfirmed(pending.run);
    },
  };
}
