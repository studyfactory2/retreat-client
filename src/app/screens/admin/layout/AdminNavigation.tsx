import { Link, matchPath, useLocation } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';

const navigationItems = [
  {
    to: appRoutes.admin,
    label: '운영 현황',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    to: appRoutes.adminCalendar,
    label: '이용 일정',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4m10-4v4M3 11h18M7 15h2m6 0h2m-10 3h2" />
      </svg>
    ),
  },
  {
    to: appRoutes.adminSubmissions,
    label: '제출 기록',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M8 4H6a2 2 0 0 0-2 2v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a2 2 0 0 0-2-2h-2M8 10h8M8 14h8M8 18h5" />
        <rect x="8" y="2" width="8" height="4" rx="1" />
      </svg>
    ),
  },
  {
    to: appRoutes.adminProperties,
    label: '휴양소 관리',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M16 9h4v12M2 21h20M8 7h4M8 11h4M8 15h4M8 21v-3h4v3" />
      </svg>
    ),
  },
];

export function AdminNavigation() {
  const { pathname } = useLocation();
  const stayRoute = matchPath(
    { path: appRoutes.adminStays, end: false },
    pathname,
  );

  return (
    <nav aria-label="관리자 메뉴">
      {navigationItems.map(({ to, label, icon }) => {
        const exact = matchPath({ path: to, end: true }, pathname);
        const active =
          matchPath({ path: to, end: to === appRoutes.admin }, pathname) ||
          (to === appRoutes.adminCalendar && stayRoute);

        return (
          <Link
            key={to}
            className={`admin-layout__nav-link${active ? ' active' : ''}`}
            to={to}
            aria-current={active ? (exact ? 'page' : 'location') : undefined}
          >
            {icon}
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
