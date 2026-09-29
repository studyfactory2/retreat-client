import type { AdminMaintenanceInput } from '../../../../features/admin-maintenance/admin-maintenance.types';
import {
  isMaintenanceId,
  validateMaintenanceFilters,
} from '../../../../features/admin-maintenance/admin-maintenance-validation';

export { validateMaintenanceFilters as maintenanceFilterErrors };
export type { MaintenanceFilterErrors } from '../../../../features/admin-maintenance/admin-maintenance-validation';

function field(search: URLSearchParams, key: string): string | undefined {
  const values = search.getAll(key);
  // Duplicate filters stay invalid instead of silently choosing a broader query.
  return values.length > 1 ? values.join(',') : values[0];
}

export function readMaintenanceFilters(
  search: URLSearchParams,
): AdminMaintenanceInput {
  const rawPage = search.get('page') ?? '1';
  const page = /^\d{1,6}$/.test(rawPage) ? Number(rawPage) : 1;
  const propertyId = field(search, 'propertyId');
  return {
    page: Number.isInteger(page) && page >= 1 && page <= 100_000 ? page : 1,
    propertyId: isMaintenanceId(propertyId)
      ? propertyId.toLowerCase()
      : propertyId,
    from: field(search, 'from'),
    to: field(search, 'to'),
    dateField: field(search, 'dateField') ?? 'STARTED',
    view: field(search, 'view') ?? 'ALL',
  };
}

export function maintenanceSearch(input: AdminMaintenanceInput): string {
  const query = new URLSearchParams();
  for (const key of ['propertyId', 'from', 'to'] as const)
    if (input[key] !== undefined) query.set(key, input[key]);
  if (input.dateField !== 'STARTED') query.set('dateField', input.dateField);
  if (input.view !== 'ALL') query.set('view', input.view);
  if (input.page > 1) query.set('page', String(input.page));
  return query.size ? `?${query}` : '';
}
