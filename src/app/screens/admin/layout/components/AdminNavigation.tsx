import { Link, matchPath, useLocation } from 'react-router-dom';
import { appRoutes } from '../../../../core/router/routes';
import { adminPrimaryMenu, adminSecondaryMenu } from '../model/admin-menu';
import { AdminMenuIcon } from './AdminMenuIcon';

export function AdminNavigation() {
  const { pathname, search } = useLocation();
  const maintenanceDetail =
    matchPath(appRoutes.adminSubmissionDetail, pathname) &&
    new URLSearchParams(search).get('source') === 'maintenance';
  const stayRoute = !!matchPath(
    { path: appRoutes.adminStays, end: false },
    pathname,
  );
  function activeRoute(to: string): boolean {
    if (
      maintenanceDetail &&
      (to === appRoutes.adminMaintenance || to === appRoutes.adminSubmissions)
    )
      return to === appRoutes.adminMaintenance;
    return (
      !!matchPath({ path: to, end: to === appRoutes.admin }, pathname) ||
      (to === appRoutes.adminCalendar && stayRoute)
    );
  }
  const moreActive =
    pathname === appRoutes.adminMore ||
    adminSecondaryMenu.some((item) => activeRoute(item.to));
  return (
    <nav aria-label="관리자 메뉴">
      {[...adminPrimaryMenu, ...adminSecondaryMenu].map((item) => {
        const active = activeRoute(item.to);
        const secondary = adminSecondaryMenu.some(
          (entry) => entry.to === item.to,
        );
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`admin-layout__nav-link${secondary ? ' admin-layout__nav-link--secondary' : ''}${active ? ' active' : ''}`}
            aria-current={
              active ? (pathname === item.to ? 'page' : 'location') : undefined
            }
          >
            <AdminMenuIcon name={item.icon} />
            <span className="admin-layout__link-label">{item.label}</span>
            <span className="admin-layout__link-short">{item.mobileLabel}</span>
          </Link>
        );
      })}
      <Link
        className={`admin-layout__nav-link admin-layout__nav-link--more${moreActive ? ' active' : ''}`}
        to={appRoutes.adminMore}
        aria-current={
          moreActive
            ? pathname === appRoutes.adminMore
              ? 'page'
              : 'location'
            : undefined
        }
      >
        <AdminMenuIcon name="more" />
        <span>더보기</span>
      </Link>
    </nav>
  );
}
