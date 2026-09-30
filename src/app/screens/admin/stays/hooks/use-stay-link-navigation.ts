import { useCallback, useEffect, useRef, useState } from 'react';

export interface StayLinkNavigationGuard {
  isBusy: () => boolean;
  hasReceipt: () => boolean;
}

// Page-local controls only, consistent with the existing stay form guards.
export function useStayLinkNavigation() {
  const guard = useRef<StayLinkNavigationGuard | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const register = useCallback((next: StayLinkNavigationGuard | null) => {
    guard.current = next;
    setBusy(next?.isBusy() ?? false);
  }, []);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!guard.current?.isBusy() && !guard.current?.hasReceipt()) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  return {
    busy,
    pending: pending !== null,
    register,
    request: (run: () => void) => {
      if (pending || guard.current?.isBusy()) return;
      if (!guard.current?.hasReceipt()) {
        setPending(null);
        return run();
      }
      trigger.current = document.activeElement instanceof HTMLElement
        ? document.activeElement : null;
      setPending(() => run);
    },
    keep: () => {
      setPending(null);
      requestAnimationFrame(() => {
        if (trigger.current?.isConnected) trigger.current.focus();
      });
    },
    proceed: () => {
      if (guard.current?.isBusy()) return;
      setPending(null);
      pending?.();
    },
  };
}
