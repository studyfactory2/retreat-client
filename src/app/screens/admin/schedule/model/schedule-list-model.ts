import {
  isCalendarDate,
  isCalendarPropertyId,
} from '../../../../features/admin-calendar/admin-calendar-filters';
import type { AdminCalendarPageInput } from '../../../../features/admin-calendar/admin-calendar.types';
import { getMonthRange } from '../../calendar/model/calendar-model';

export interface ScheduleListFilters extends AdminCalendarPageInput {
  date: string;
}

export function validateScheduleRange(
  from: string,
  to: string,
): string | undefined {
  if (!isCalendarDate(from) || !isCalendarDate(to))
    return '조회 기간을 1900~2100년의 날짜로 입력해 주세요.';
  const days = (Date.parse(to) - Date.parse(from)) / 86_400_000 + 1;
  if (days < 1) return '종료일은 시작일과 같거나 이후여야 합니다.';
  if (days > 62) return '조회 기간은 최대 62일입니다.';
  return undefined;
}

export function readScheduleListFilters(
  search: URLSearchParams,
  today: string,
): {
  filters: ScheduleListFilters;
  error?: string;
} {
  const date = search.get('date') ?? today;
  const fallback = getMonthRange(
    isCalendarDate(date) ? date.slice(0, 7) : today.slice(0, 7),
  );
  const from = search.get('from') ?? fallback.from;
  const to = search.get('to') ?? fallback.to;
  const propertyId = search.get('propertyId') ?? undefined;
  const rawPage = search.get('page') ?? '1';
  const page = /^\d+$/.test(rawPage) ? Number(rawPage) : 0;
  const error =
    ['date', 'from', 'to', 'propertyId', 'page'].some(
      (key) => search.getAll(key).length > 1,
    ) ||
    !isCalendarDate(date) ||
    !Number.isInteger(page) ||
    page < 1 ||
    page > 100_000 ||
    (propertyId !== undefined && !isCalendarPropertyId(propertyId))
      ? '조회 조건이 올바르지 않습니다. 날짜와 휴양소를 다시 선택해 주세요.'
      : validateScheduleRange(from, to);
  return {
    filters: {
      date: isCalendarDate(date) ? date : today,
      from: isCalendarDate(from) ? from : fallback.from,
      to: isCalendarDate(to) ? to : fallback.to,
      page: Number.isInteger(page) && page >= 1 && page <= 100_000 ? page : 1,
      propertyId:
        propertyId !== undefined && isCalendarPropertyId(propertyId)
          ? propertyId.toLowerCase()
          : undefined,
    },
    error,
  };
}

export function scheduleListSearch(filters: ScheduleListFilters): string {
  const query = new URLSearchParams({
    view: 'schedule-list',
    date: filters.date,
    from: filters.from,
    to: filters.to,
  });
  if (filters.propertyId) query.set('propertyId', filters.propertyId);
  if (filters.page > 1) query.set('page', String(filters.page));
  return `?${query}`;
}
