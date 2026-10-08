import type { AdminMaintenanceInput } from '../../../../features/admin-maintenance/admin-maintenance.types';
import type { AdminPropertyOption } from '../../../../features/admin-properties/admin-properties.types';
import {
  appliedDateRange,
  appliedPropertyLabel,
} from '../../model/applied-filter-summary';
import { maintenanceFilterErrors } from './maintenance-filters';

const recordLabels: Record<string, string> = {
  ALL: '전체 기록',
  UNFINISHED: '미완료',
  COMPLETED: '제출된 기록',
};

export function maintenanceAppliedFilters(
  input: AdminMaintenanceInput,
  properties?: AdminPropertyOption[],
): { label: string; value: string }[] {
  if (Object.keys(maintenanceFilterErrors(input)).length) return [];
  return [
    {
      label: '휴양소',
      value: appliedPropertyLabel(input.propertyId, properties),
    },
    { label: '기록', value: recordLabels[input.view] },
    {
      label: '날짜 기준',
      value: input.dateField === 'STARTED' ? '작성 시작일' : '제출일',
    },
    { label: '기간', value: appliedDateRange(input.from, input.to) },
  ];
}
