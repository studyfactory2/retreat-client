import {
  isCalendarDate,
  isCalendarPropertyId,
} from '../../../../features/admin-calendar/admin-calendar-filters';
import type { AdminCalendarStayDto } from '../../../../features/admin-calendar/admin-calendar.types';

export interface CalendarDay {
  date: string;
  day: number;
  arrivals: number;
  departures: number;
  continuing: number;
  stays: AdminCalendarStayDto[];
}

export function readCalendarFilters(search: URLSearchParams, today: string) {
  const date = search.get('date') ?? today;
  const propertyId = search.get('propertyId') ?? undefined;
  const invalid =
    search.getAll('date').length > 1 ||
    search.getAll('propertyId').length > 1 ||
    !isCalendarDate(date) ||
    (propertyId !== undefined && !isCalendarPropertyId(propertyId));
  return {
    date: invalid ? today : date,
    propertyId: invalid ? undefined : propertyId?.toLowerCase(),
    error: invalid
      ? '조회 조건이 올바르지 않습니다. 날짜와 휴양소를 다시 선택해 주세요.'
      : undefined,
  };
}

// Date-only calendar arithmetic stays in UTC; server timestamps are classified
// by their supplied Seoul expectedDate, never by the browser's local timezone.
export function getMonthRange(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  const end = new Date(Date.UTC(year, monthNumber, 0));
  return { from: `${month}-01`, to: end.toISOString().slice(0, 10) };
}

export function shiftCalendarMonth(
  date: string,
  offset: -1 | 1,
): string | null {
  const [year, month] = date.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1 + offset, 1))
    .toISOString()
    .slice(0, 10);
  return isCalendarDate(next) ? next : null;
}

export function getMonthDays(
  month: string,
  stays: AdminCalendarStayDto[],
): CalendarDay[] {
  const { to } = getMonthRange(month);
  const days = Array.from({ length: Number(to.slice(8)) }, (_, index) => ({
    date: `${month}-${String(index + 1).padStart(2, '0')}`,
    day: index + 1,
    arrivals: 0,
    departures: 0,
    continuing: 0,
    stays: [] as AdminCalendarStayDto[],
  }));
  for (const stay of stays) {
    const arrival = stay.checkIn.expectedDate;
    const departure = stay.checkOut.expectedDate;
    for (const day of days) {
      // Include the checkout day as an event, including checkout at midnight.
      if (arrival > day.date || departure < day.date) continue;
      day.stays.push(stay);
      if (arrival === day.date) day.arrivals += 1;
      if (departure === day.date) day.departures += 1;
      if (arrival < day.date && departure > day.date) day.continuing += 1;
    }
  }
  return days;
}
