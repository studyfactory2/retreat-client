import { useRef, useState } from 'react';
import { useAdminNavigationGuard } from '../../hooks/use-admin-navigation-guard';

export function useChecklistNavigation(
  dirty: boolean,
  busy: boolean,
  hasPendingWork: () => boolean,
) {
  const runConfirmed = useAdminNavigationGuard(hasPendingWork);
  const [pending, setPending] = useState<{
    kind: 'return' | 'reload';
    run: () => void;
  } | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  return {
    runConfirmed,
    pending: pending?.kind ?? null,
    request: (kind: 'return' | 'reload', run: () => void) => {
      if (busy) return;
      if (!dirty) return run();
      trigger.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      setPending({ kind, run });
    },
    keep: () => {
      setPending(null);
      requestAnimationFrame(() => {
        if (trigger.current?.isConnected) trigger.current.focus();
      });
    },
    proceed: () => {
      if (busy) return;
      setPending(null);
      if (pending) runConfirmed(pending.run);
    },
  };
}
