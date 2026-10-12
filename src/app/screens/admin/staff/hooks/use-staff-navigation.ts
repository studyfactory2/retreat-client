import { useRef, useState } from 'react';
import { useAdminNavigationGuard } from '../../hooks/use-admin-navigation-guard';
export function useStaffNavigation(
  dirty: boolean,
  busy: boolean,
  hasPendingWork: () => boolean,
) {
  const runConfirmed = useAdminNavigationGuard(hasPendingWork);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  return {
    runConfirmed,
    pending: pending !== null,
    request: (operation: () => void) => {
      if (busy) return;
      if (!dirty) return operation();
      trigger.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      setPending(() => operation);
    },
    keep: () => {
      setPending(null);
      requestAnimationFrame(() => {
        if (trigger.current?.isConnected) trigger.current.focus();
      });
    },
    discard: () => {
      if (busy) return;
      setPending(null);
      if (pending) runConfirmed(pending);
    },
  };
}
