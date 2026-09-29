import type { AdminIssueFilters } from '../../../../features/admin-issues/admin-issues.types';
import {
  isIssueId,
  validateIssueFilters,
} from '../../../../features/admin-issues/admin-issues-validation';

export { validateIssueFilters as issueFilterErrors };
export type { IssueFilterErrors } from '../../../../features/admin-issues/admin-issues-validation';

function field(search: URLSearchParams, key: string): string | undefined {
  const values = search.getAll(key);
  return values.length > 1 ? values.join(',') : values[0];
}

export function readIssueFilters(search: URLSearchParams): AdminIssueFilters {
  const rawPage = search.get('page') ?? '1';
  const page = /^\d{1,6}$/.test(rawPage) ? Number(rawPage) : 1;
  const propertyId = field(search, 'propertyId');
  return {
    page: Number.isInteger(page) && page >= 1 && page <= 100_000 ? page : 1,
    propertyId: isIssueId(propertyId) ? propertyId.toLowerCase() : propertyId,
    status: field(search, 'status'),
    isUrgent: field(search, 'isUrgent'),
    from: field(search, 'from'),
    to: field(search, 'to'),
  };
}

export function issueSearch(filters: AdminIssueFilters): string {
  const query = new URLSearchParams();
  for (const key of ['propertyId', 'status', 'isUrgent', 'from', 'to'] as const)
    if (filters[key] !== undefined) query.set(key, filters[key]);
  if (filters.page > 1) query.set('page', String(filters.page));
  return query.size ? `?${query}` : '';
}
