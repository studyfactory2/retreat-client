import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import { AdminPageHistory } from '../model/admin-page-history';
import { AdminPageNavigationContext } from '../model/admin-page-navigation';

export function AdminPageNavigation({ children }: { children: ReactNode }) {
  const { pathname, search } = useLocation();
  const [history] = useState(() => new AdminPageHistory());
  const cleanup = useRef<(() => void) | null>(null);
  const restoring = useRef(false);
  const currentPath = useRef(pathname);

  useLayoutEffect(() => {
    if (currentPath.current !== pathname) cleanup.current?.();
    currentPath.current = pathname;
    const restoredScroll = history.visit(pathname, search);
    if (restoredScroll === null) return;
    const scrollY: number = restoredScroll;
    document.getElementById('main-content')?.focus({ preventScroll: true });
    restoring.current = true;
    // Lists load after navigation. Restore again as their content arrives, but
    // never fight an intentional scroll or key press by the user.
    const content = document.querySelector('.admin-layout__content');
    const observer = new ResizeObserver(() => restore());
    const stop = () => {
      restoring.current = false;
      observer.disconnect();
      history.rememberScroll(window.scrollY);
    };
    function restore() {
      if (!restoring.current) return;
      window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' });
      if (Math.abs(window.scrollY - scrollY) < 1) stop();
    }
    if (scrollY > 0 && content) observer.observe(content);
    restore();
    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchstart', stop, { passive: true });
    window.addEventListener('pointerdown', stop, { passive: true });
    window.addEventListener('keydown', stop);
    cleanup.current = () => {
      restoring.current = false;
      observer.disconnect();
      window.removeEventListener('wheel', stop);
      window.removeEventListener('touchstart', stop);
      window.removeEventListener('pointerdown', stop);
      window.removeEventListener('keydown', stop);
    };
  }, [history, pathname, search]);

  useLayoutEffect(() => () => cleanup.current?.(), []);

  useEffect(() => {
    const remember = () => {
      if (!restoring.current) history.rememberScroll(window.scrollY);
    };
    window.addEventListener('scroll', remember, { passive: true });
    return () => window.removeEventListener('scroll', remember);
  }, [history]);

  return (
    <AdminPageNavigationContext.Provider value={history}>
      {children}
    </AdminPageNavigationContext.Provider>
  );
}
