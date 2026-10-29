import type { Ref } from 'react';
import { Link, matchPath, useLocation } from 'react-router-dom';
import { appRoutes } from '../../../../core/router/routes';
import {
  adminFooterMenu,
  adminManagementMenu,
  adminRecordsMenu,
  adminSecondaryMenu,
  type AdminMenuEntry,
} from '../model/admin-menu';
import { AdminMenuIcon } from './AdminMenuIcon';

interface AdminNavigationProps {
  presentation?: 'sidebar' | 'bottom' | 'drawer';
  onNavigate?: () => void;
  onOpenMenu?: () => void;
  menuId?: string;
  menuOpen?: boolean;
  menuButtonRef?: Ref<HTMLButtonElement>;
}

export function AdminNavigation({
  presentation = 'sidebar',
  onNavigate,
  onOpenMenu,
  menuId,
  menuOpen,
  menuButtonRef,
}: AdminNavigationProps) {
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
  const morePage = !!matchPath(
    { path: appRoutes.adminMore, end: true },
    pathname,
  );
  const moreActive =
    morePage ||
    [...adminManagementMenu, ...adminSecondaryMenu].some((item) =>
      activeRoute(item.to),
    );
  const bottom = presentation === 'bottom';
  function renderLink(item: AdminMenuEntry) {
    const active = activeRoute(item.to);
    return (
      <Link
        key={item.to}
        to={item.href ?? item.to}
        onClick={onNavigate}
        className={`admin-layout__nav-link${active ? ' active' : ''}`}
        aria-current={
          active ? (pathname === item.to ? 'page' : 'location') : undefined
        }
      >
        <span className="admin-layout__nav-icon">
          <AdminMenuIcon name={item.icon} />
        </span>
        <span>{bottom ? item.mobileLabel : item.label}</span>
        {presentation === 'drawer' && (
          <span className="admin-layout__nav-chevron">
            <AdminMenuIcon name="chevron" />
          </span>
        )}
      </Link>
    );
  }
  const groups = [
    ...(presentation === 'sidebar'
      ? [{ label: '운영', items: adminFooterMenu }]
      : []),
    { label: '관리', items: adminManagementMenu },
    { label: '기록', items: adminRecordsMenu },
  ];
  return (
    <nav
      className={`admin-layout__nav admin-layout__nav--${presentation}`}
      aria-label={bottom ? '관리자 빠른 메뉴' : '관리자 전체 메뉴'}
    >
      {bottom
        ? adminFooterMenu.map(renderLink)
        : groups.map((group) => (
            <div className="admin-layout__nav-group" key={group.label}>
              <p className="admin-layout__nav-heading">{group.label}</p>
              {group.items.map(renderLink)}
            </div>
          ))}
      {bottom ? (
        <button
          ref={menuButtonRef}
          className={`admin-layout__nav-link${moreActive || menuOpen ? ' active' : ''}`}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={!!menuOpen}
          aria-controls={menuId}
          onClick={onOpenMenu}
        >
          <span className="admin-layout__nav-icon">
            <AdminMenuIcon name="menu" />
          </span>
          <span>메뉴</span>
        </button>
      ) : presentation === 'sidebar'
        ? adminSecondaryMenu
            .filter((item) => item.to === appRoutes.adminAccount)
            .map(renderLink)
        : null}
    </nav>
  );
}
