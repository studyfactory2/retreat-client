import { useEffect, useRef, useState } from 'react';

export function useQrNavigation(hasReceipts: boolean, busy: boolean) {
  const [pending, setPending] = useState<{
    action: 'return' | 'refresh';
    run: () => void;
  } | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!hasReceipts && !busy) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasReceipts, busy]);
  return {
    pending: pending?.action ?? null,
    request: (action: 'return' | 'refresh', run: () => void) => {
      if (busy) return;
      if (!hasReceipts) return run();
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
      if (busy) return;
      setPending(null);
      pending?.run();
    },
  };
}
