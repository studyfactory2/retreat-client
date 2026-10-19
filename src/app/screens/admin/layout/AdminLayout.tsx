import { APP_BRAND } from '../../../core/config/brand';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { BrandLogo } from '../../../shared/ui/BrandLogo/BrandLogo';
import { useAdminLogout } from '../hooks/use-admin-logout';
import { AdminNavigation } from './components/AdminNavigation';
import { AdminMenuIcon } from './components/AdminMenuIcon';
import './styles/admin-layout.css';

export function AdminLayout() {
  const { state } = useAdminSession();
  const logout = useAdminLogout();
  const { pathname, search } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawer = useRef<HTMLDialogElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const drawerId = useId();
  const drawerTitleId = useId();

  const closeDrawer = useCallback((restoreFocus = true) => {
    drawer.current?.close();
    setDrawerOpen(false);
    if (restoreFocus) menuButton.current?.focus({ preventScroll: true });
  }, []);

  useLayoutEffect(() => {
    if (!drawerOpen) return;
    const element = drawer.current;
    if (!element) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen]);

  useEffect(() => {
    // Route changes close the native surface; its close event updates state.
    drawer.current?.close();
  }, [pathname, search]);

  useEffect(() => {
    document.getElementById('main-content')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 761px)');
    const closeOnDesktop = () => {
      if (!desktop.matches || !drawer.current?.open) return;
      closeDrawer(false);
      document.getElementById('main-content')?.focus({ preventScroll: true });
    };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, [closeDrawer]);

  if (state.status !== 'authenticated') return null;

  return (
    <div className="admin-layout">
      <a
        className="admin-layout__skip"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          const main = document.getElementById('main-content');
          main?.focus();
          main?.scrollIntoView();
        }}
      >
        본문으로 바로가기
      </a>

      <header className="admin-layout__header">
        <NavLink
          className="admin-layout__brand"
          to={appRoutes.admin}
          aria-label={`${APP_BRAND.appName} 관리 홈`}
        >
          <BrandLogo />
          <span>휴양소 관리</span>
        </NavLink>
        <div className="admin-layout__account">
          <span className="admin-layout__avatar" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3" />
              <path d="M5 20v-2a7 7 0 0 1 14 0v2" />
            </svg>
          </span>
          <span className="admin-layout__identity">
            <strong title={state.user.name}>{state.user.name}</strong>
            <span>관리자</span>
          </span>
          <button
            className="admin-layout__logout admin-layout__logout--header"
            type="button"
            onClick={logout}
          >
            로그아웃
          </button>
        </div>
      </header>

      <aside className="admin-layout__sidebar">
        <AdminNavigation />
        <Link className="admin-layout__app-guide" to={appRoutes.home}>
          앱 안내 <span aria-hidden="true">↗</span>
        </Link>
      </aside>

      <main className="admin-layout__main" id="main-content" tabIndex={-1}>
        <div className="admin-layout__content">
          {state.storageNotice && (
            <p className="admin-layout__notice" role="status">
              {state.storageNotice}
            </p>
          )}
          <Outlet />
        </div>
      </main>

      <div className="admin-layout__bottom">
        <AdminNavigation
          presentation="bottom"
          menuId={drawerId}
          menuOpen={drawerOpen}
          menuButtonRef={menuButton}
          onOpenMenu={() => setDrawerOpen(true)}
        />
      </div>

      <dialog
        ref={drawer}
        id={drawerId}
        className="admin-layout__drawer"
        aria-labelledby={drawerTitleId}
        onCancel={(event) => {
          event.preventDefault();
          closeDrawer();
        }}
        onClose={() => {
          if (!drawer.current?.open) setDrawerOpen(false);
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left || event.clientX > bounds.right ||
            event.clientY < bounds.top || event.clientY > bounds.bottom
          ) closeDrawer();
        }}
      >
        <div className="admin-layout__drawer-header">
          <h2 id={drawerTitleId}>전체 메뉴</h2>
          <button
            className="admin-layout__drawer-close"
            type="button"
            aria-label="메뉴 닫기"
            autoFocus
            onClick={() => closeDrawer()}
          >
            <AdminMenuIcon name="close" />
          </button>
        </div>
        <div className="admin-layout__drawer-account">
          <strong>{state.user.name}</strong>
          <span>관리자</span>
        </div>
        <AdminNavigation
          presentation="drawer"
          // Close the native modal before the existing navigation guard opens
          // its own confirmation. Links still follow the normal router flow.
          onNavigate={() => closeDrawer()}
        />
        <div className="admin-layout__drawer-footer">
          <button
            className="admin-layout__logout"
            type="button"
            onClick={() => {
              closeDrawer();
              logout();
            }}
          >
            로그아웃
          </button>
        </div>
      </dialog>
    </div>
  );
}
