export const appRoutes = {
  home: '/',
  adminLogin: '/admin/login',
  admin: '/admin',
  adminCalendar: '/admin/calendar',
  adminStayCreate: '/admin/stays/new',
  adminStayDetail: '/admin/stays/:id',
  guest: '/guest',
  guestStay: '/guest/stay',
  staff: '/staff',
  draft: '/draft',
  connection: '/dev/connection',
} as const;
