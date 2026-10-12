import { useState } from 'react';
import { useAdminNavigationGuard } from '../../hooks/use-admin-navigation-guard';

export function useUnsavedStay(dirty: boolean | (() => boolean)) {
  const [pending, setPending] = useState<(() => void) | null>(null);
  const runConfirmed = useAdminNavigationGuard(dirty);
  return {
    pending: pending !== null,
    runConfirmed,
    askToLeave: (proceed: () => void) => {
      if (typeof dirty === 'function' ? dirty() : dirty)
        setPending(() => proceed);
      else proceed();
    },
    keepEditing: () => setPending(null),
    discard: () => {
      setPending(null);
      if (pending) runConfirmed(pending);
    },
  };
}
