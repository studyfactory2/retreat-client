import { appRoutes } from '../../../../core/router/routes';
import type { AdminMaintenanceInput } from '../../../../features/admin-maintenance/admin-maintenance.types';
import {
  maintenanceSearch,
  readMaintenanceFilters,
} from './maintenance-filters';

export function maintenanceDetailPath(
  id: string,
  input: AdminMaintenanceInput,
) {
  const query = new URLSearchParams(maintenanceSearch(input));
  query.set('source', 'maintenance');
  return `${appRoutes.adminSubmissions}/${id}?${query}`;
}
export function maintenanceReturnPath(
  search: URLSearchParams,
): string | undefined {
  if (search.get('source') !== 'maintenance') return undefined;
  return `${appRoutes.adminMaintenance}${maintenanceSearch(readMaintenanceFilters(search))}`;
}
