import { useEffect, useState } from 'react';

export function useIssueNavigation(dirty: boolean, busy: boolean) {
  const [pending, setPending] = useState<(() => void) | null>(null);
  useEffect(() => {
    if (!dirty && !busy) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, busy]);
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
        pending?.();
      }
    },
  };
}
