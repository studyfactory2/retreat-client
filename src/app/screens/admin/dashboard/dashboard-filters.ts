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
