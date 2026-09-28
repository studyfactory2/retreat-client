import { useEffect, useState } from 'react';

export function useUnsavedStay(dirty: boolean) {
  const [pending, setPending] = useState<(() => void) | null>(null);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  return {
    pending: pending !== null,
    askToLeave: (proceed: () => void) => {
      if (dirty) setPending(() => proceed);
      else proceed();
    },
    keepEditing: () => setPending(null),
    discard: () => {
      setPending(null);
      pending?.();
    },
  };
}
