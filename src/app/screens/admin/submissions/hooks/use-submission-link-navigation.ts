import { useState } from 'react';
import { useAdminNavigationGuard } from '../../hooks/use-admin-navigation-guard';

export function useSubmissionLinkNavigation(dirty: boolean, busy: boolean) {
  const [pending, setPending] = useState<(() => void) | null>(null);
  const runConfirmed = useAdminNavigationGuard(false);
  return {
    pending: pending !== null,
    request: (operation: () => void) => {
      if (busy) return;
      if (dirty) setPending(() => operation);
      else operation();
    },
    keep: () => setPending(null),
    discard: () => {
      if (!busy) {
        setPending(null);
        if (pending) runConfirmed(pending);
      }
    },
  };
}
