import {
  isDashboardDate,
  isDashboardPropertyId,
} from '../../../features/admin-dashboard/admin-dashboard-filters';
import type { AdminDashboardInput } from '../../../features/admin-dashboard/admin-dashboard.types';

export function readDashboardFilters(search: URLSearchParams): {
  input: AdminDashboardInput;
  error?: string;
} {
  const date = search.get('date') ?? undefined;
  const propertyId = search.get('propertyId') ?? undefined;
  if (
    search.getAll('date').length > 1 ||
    search.getAll('propertyId').length > 1 ||
    (date !== undefined && !isDashboardDate(date)) ||
    (propertyId !== undefined && !isDashboardPropertyId(propertyId))
  ) {
    return {
      input: {},
      error:
        '조회 조건이 올바르지 않습니다. 날짜와 휴양소를 다시 선택해 주세요.',
    };
  }
  return { input: { date, propertyId: propertyId?.toLowerCase() } };
}

export function getSeoulToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) =>
    parts.find((value) => value.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function formatDashboardTime(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(value));
}
