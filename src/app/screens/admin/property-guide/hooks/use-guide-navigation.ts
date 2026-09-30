import { useEffect, useRef, useState } from 'react';

export function useGuideNavigation(dirty: boolean, busy: boolean) {
  const [pending, setPending] = useState<{
    kind: 'return' | 'reload';
    run: () => void;
  } | null>(null);
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
      pending?.run();
    },
  };
}
