import { useEffect } from 'react';

export function useStayScreenFocus(message?: string) {
  useEffect(() => {
    document.getElementById('main-content')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, left: 0 });
  }, []);
  useEffect(() => {
    if (message)
      document
        .querySelector<HTMLElement>('.stay-banner[role="alert"]')
        ?.focus();
  }, [message]);
}
