import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { AdminNavigation } from './components/AdminNavigation';
import './styles/admin-layout.css';

export function AdminLayout() {
  const { state, logout } = useAdminSession();
  const { pathname } = useLocation();

  useEffect(() => {
    document.getElementById('main-content')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

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
          aria-label="ITCEN 휴양소 관리 홈"
        >
          ITCEN<span>휴양소 관리</span>
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
            className="admin-layout__logout"
            type="button"
            onClick={logout}
          >
            로그아웃
          </button>
        </div>
      </header>

      <aside className="admin-layout__sidebar">
        <div className="admin-layout__navigation">
          <p className="admin-layout__nav-label">관리 메뉴</p>
          <AdminNavigation />
        </div>
        <div className="admin-layout__signature">
          <small>운영 · OH BOK</small>
        </div>
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
    </div>
  );
}
