import { useEffect, useRef, useState } from 'react';
export function useStaffNavigation(dirty: boolean, busy: boolean) {
  const [pending, setPending] = useState<(() => void) | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
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
      pending?.();
    },
  };
}
