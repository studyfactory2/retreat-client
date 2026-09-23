import { appRoutes } from '../../../core/router/routes';
import { getSeoulToday } from '../../../core/dates/seoul-date';
import { readCalendarFilters } from '../calendar/calendar-model';
import type { AdminStayDto } from '../../../features/admin-stays/admin-stays.types';
import { isCalendarDate } from '../../../features/admin-calendar/admin-calendar-filters';

export function getStayNavigation(search: URLSearchParams) {
  const { date, propertyId } = readCalendarFilters(search, getSeoulToday());
  const query = new URLSearchParams({ date });
  if (propertyId) query.set('propertyId', propertyId);
  return {
    date,
    propertyId,
    search: `?${query}`,
    calendar: `${appRoutes.adminCalendar}?${query}`,
  };
}

export function getSavedStayCalendar(stay: AdminStayDto, selectedDate: string) {
  const offset = 9 * 60 * 60 * 1000;
  const arrival = new Date(Date.parse(stay.checkInAt) + offset)
    .toISOString()
    .slice(0, 10);
  const departure = new Date(Date.parse(stay.checkOutAt) + offset)
    .toISOString()
    .slice(0, 10);
  const date =
    selectedDate >= arrival && selectedDate <= departure
      ? selectedDate
      : arrival;
  if (!isCalendarDate(date)) return `/admin/stays/${stay.id}`;
  return `${appRoutes.adminCalendar}?${new URLSearchParams({ date, propertyId: stay.propertyId })}`;
}
