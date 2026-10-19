import type { Ref } from 'react';
import { Link, matchPath, useLocation } from 'react-router-dom';
import { appRoutes } from '../../../../core/router/routes';
import { adminPrimaryMenu, adminSecondaryMenu } from '../model/admin-menu';
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
    morePage || adminSecondaryMenu.some((item) => activeRoute(item.to));
  const bottom = presentation === 'bottom';
  const menu = bottom
    ? adminPrimaryMenu
    : [...adminPrimaryMenu, ...adminSecondaryMenu];
  return (
    <nav
      className={`admin-layout__nav admin-layout__nav--${presentation}`}
      aria-label={bottom ? '관리자 빠른 메뉴' : '관리자 전체 메뉴'}
    >
      {menu.map((item) => {
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
            <AdminMenuIcon name={item.icon} />
            <span>{bottom ? item.mobileLabel : item.label}</span>
          </Link>
        );
      })}
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
          <AdminMenuIcon name="menu" />
          <span>메뉴</span>
        </button>
      ) : (
        <Link
          className={`admin-layout__nav-link admin-layout__nav-link--more${morePage ? ' active' : ''}`}
          to={appRoutes.adminMore}
          onClick={onNavigate}
          aria-current={morePage ? 'page' : undefined}
        >
          <AdminMenuIcon name="more" />
          <span>더보기</span>
        </Link>
      )}
    </nav>
  );
}
