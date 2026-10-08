import type { AdminIssueFilters } from '../../../../features/admin-issues/admin-issues.types';
import type { AdminPropertyOption } from '../../../../features/admin-properties/admin-properties.types';
import {
  appliedDateRange,
  appliedPropertyLabel,
} from '../../model/applied-filter-summary';
import { issueCancellationLabel } from './issue-filters';
import { issueStatusLabel } from './issue-presentation';

export function issueAppliedSummary(
  filters: AdminIssueFilters,
  properties?: AdminPropertyOption[],
) {
  return [
    {
      label: '휴양소',
      value: appliedPropertyLabel(filters.propertyId, properties),
    },
    {
      label: '처리 상태',
      value:
        filters.status === 'NEW' ||
        filters.status === 'IN_PROGRESS' ||
        filters.status === 'RESOLVED'
          ? issueStatusLabel(filters.status)
          : '전체 상태',
    },
    {
      label: '긴급 여부',
      value:
        filters.isUrgent === 'true'
          ? '긴급 신고'
          : filters.isUrgent === 'false'
            ? '일반 신고'
            : '전체',
    },
    { label: '취소 여부', value: issueCancellationLabel(filters.cancellation) },
    { label: '접수일', value: appliedDateRange(filters.from, filters.to) },
  ];
}
