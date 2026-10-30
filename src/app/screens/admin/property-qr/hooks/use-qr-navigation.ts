import { useRef, useState } from 'react';
import { useAdminNavigationGuard } from '../../hooks/use-admin-navigation-guard';

export type QrNavigationAction = 'return' | 'refresh' | 'close' | 'select';

export function useQrNavigation({
  isBusy,
  hasOneTimeReceipt,
  hasPendingChanges,
}: {
  isBusy: () => boolean;
  hasOneTimeReceipt: () => boolean;
  hasPendingChanges: () => boolean;
}) {
  const [pending, setPending] = useState<{
    action: QrNavigationAction;
    run: () => void;
  } | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const runConfirmed = useAdminNavigationGuard(hasPendingChanges);
  return {
    pending: pending?.action ?? null,
    request: (action: QrNavigationAction, run: () => void) => {
      if (isBusy()) return;
      if (!hasOneTimeReceipt()) return run();
      trigger.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      setPending({ action, run });
    },
    keep: () => {
      setPending(null);
      requestAnimationFrame(() => {
        if (trigger.current?.isConnected) trigger.current.focus();
      });
    },
    proceed: () => {
      if (isBusy()) return;
      setPending(null);
      if (pending) runConfirmed(pending.run);
    },
  };
}
