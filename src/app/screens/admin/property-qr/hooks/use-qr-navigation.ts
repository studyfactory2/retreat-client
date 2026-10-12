import { useRef, useState } from 'react';
import { useAdminNavigationGuard } from '../../hooks/use-admin-navigation-guard';

export function useQrNavigation({
  isBusy,
  hasReceipts,
  hasPendingChanges,
}: {
  isBusy: () => boolean;
  hasReceipts: () => boolean;
  hasPendingChanges: () => boolean;
}) {
  const [pending, setPending] = useState<{
    action: 'return' | 'refresh';
    run: () => void;
  } | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const runConfirmed = useAdminNavigationGuard(hasPendingChanges);

  return {
    pending: pending?.action ?? null,
    request: (action: 'return' | 'refresh', run: () => void) => {
      if (isBusy()) return;
      if (!hasReceipts()) return run();
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
