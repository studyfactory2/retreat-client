import { useEffect } from 'react';

export function useGuestIssueReportLifetime({
  token,
  warnBeforeLeave,
  recheck,
  restored,
}: {
  token: string | null;
  warnBeforeLeave: boolean;
  recheck: () => void;
  restored: () => void;
}) {
  useEffect(() => {
    if (token === null) return;
    let wasAway = document.visibilityState === 'hidden';
    const leave = () => {
      wasAway = true;
    };
    const resume = () => {
      if (!wasAway || document.visibilityState === 'hidden') return;
      wasAway = false;
      recheck();
    };
    const visibility = () =>
      document.visibilityState === 'hidden' ? leave() : resume();
    const pageshow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      wasAway = false;
      restored();
    };
    window.addEventListener('blur', leave);
    window.addEventListener('focus', resume);
    window.addEventListener('pagehide', leave);
    window.addEventListener('pageshow', pageshow);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('blur', leave);
      window.removeEventListener('focus', resume);
      window.removeEventListener('pagehide', leave);
      window.removeEventListener('pageshow', pageshow);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [recheck, restored, token]);

  useEffect(() => {
    if (!warnBeforeLeave) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [warnBeforeLeave]);
}
