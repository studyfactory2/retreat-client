import { NavLink, Outlet } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';
import { useAdminSession } from '../../../core/session/use-admin-session';
import './admin-layout.css';

export function AdminLayout() {
  const { state, logout } = useAdminSession();

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
          aria-label="오복 휴양소 관리 홈"
        >
          OH BOK<span>RETREAT</span>
        </NavLink>
        <span className="admin-layout__workspace">휴양소 관리</span>
        <div className="admin-layout__account">
          <span className="admin-layout__avatar" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3" />
              <path d="M5 20v-2a7 7 0 0 1 14 0v2" />
            </svg>
          </span>
          <span className="admin-layout__identity">
            <strong>{state.user.name}</strong>
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
          <p className="admin-layout__nav-label">WORKSPACE</p>
          <nav aria-label="관리자 메뉴">
            <NavLink
              className="admin-layout__nav-link"
              to={appRoutes.admin}
              end
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
              운영 현황
            </NavLink>
            <NavLink
              className="admin-layout__nav-link"
              to={appRoutes.adminCalendar}
              end
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M7 3v4m10-4v4M3 11h18M7 15h2m6 0h2m-10 3h2" />
              </svg>
              이용 일정
            </NavLink>
            <NavLink
              className="admin-layout__nav-link"
              to={appRoutes.adminProperties}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M16 9h4v12M2 21h20M8 7h4M8 11h4M8 15h4M8 21v-3h4v3" />
              </svg>
              휴양소 관리
            </NavLink>
          </nav>
        </div>
        <div className="admin-layout__signature">
          <span aria-hidden="true" />
          <p>
            편안한 쉼을 위한
            <br />
            세심한 관리.
          </p>
          <small>OH BOK RETREAT</small>
        </div>
      </aside>

      <main className="admin-layout__main" id="main-content" tabIndex={-1}>
        {state.storageNotice && (
          <p className="admin-layout__notice" role="status">
            {state.storageNotice}
          </p>
        )}
        <Outlet />
      </main>
    </div>
  );
}
