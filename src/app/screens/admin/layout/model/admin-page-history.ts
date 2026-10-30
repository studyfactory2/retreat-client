import { appRoutes } from '../../../../core/router/routes';

type PageVisit = { pathname: string; search: string; scrollY: number };

export function adminParentPath(pathname: string): string {
  const property = pathname.match(/^\/admin\/properties\/([^/]+)(?:\/(.+))?$/);
  if (property) {
    const [, id, section] = property;
    if (!section || id === 'new') return appRoutes.adminProperties;
    if (section.startsWith('checklists/'))
      return `/admin/properties/${id}/checklists`;
    return `/admin/properties/${id}`;
  }
  const staff = pathname.match(/^\/admin\/staff\/([^/]+)(?:\/handover)?$/);
  if (staff)
    return pathname.endsWith('/handover')
      ? `/admin/staff/${staff[1]}`
      : appRoutes.adminStaff;
  if (pathname.startsWith('/admin/submissions/'))
    return appRoutes.adminSubmissions;
  if (pathname.startsWith('/admin/issues/')) return appRoutes.adminIssues;
  if (pathname.startsWith('/admin/stays/')) return appRoutes.adminStays;
  if (pathname === appRoutes.adminStays) return appRoutes.adminCalendar;
  return appRoutes.admin;
}

const roots: readonly string[] = [
  appRoutes.admin,
  appRoutes.adminCalendar,
  appRoutes.adminIssues,
  appRoutes.adminMore,
];

// Only accepted administrator routes are retained, in memory for this session.
// Filter changes update the current visit instead of becoming extra Back steps.
export class AdminPageHistory {
  private pages: PageVisit[] = [];

  visit(pathname: string, search: string): number | null {
    const last = this.pages.at(-1);
    if (last?.pathname === pathname) {
      last.search = search;
      return null;
    }
    const previous = this.pages.findLastIndex(
      (page) => page.pathname === pathname && page.search === search,
    );
    if (previous >= 0) {
      this.pages = this.pages.slice(0, previous + 1);
      return this.pages[previous].scrollY;
    }
    if (roots.includes(pathname)) this.pages = [];
    this.pages.push({ pathname, search, scrollY: 0 });
    if (this.pages.length > 40) this.pages.shift();
    return 0;
  }

  rememberScroll(scrollY: number): void {
    const current = this.pages.at(-1);
    if (current) current.scrollY = Math.max(0, scrollY);
  }

  destination(pathname: string, fallback = adminParentPath(pathname)): string {
    const current = this.pages.at(-1);
    const previous = this.pages.at(-2);
    if (current?.pathname === pathname && previous)
      return previous.pathname + previous.search;
    // Fallbacks come from route constants/screen-owned validated return queries.
    return /^\/admin(?:\/|$|\?)/.test(fallback) &&
      !fallback.startsWith('/admin/login') &&
      fallback !== pathname
      ? fallback
      : appRoutes.admin;
  }
}
