import { apiRequest } from '../../core/api/api-client';
import { ApiRequestError } from '../../core/api/api-error';
import { readMaintenancePage } from './admin-maintenance-readers';
import type {
  AdminMaintenanceDto,
  AdminMaintenanceInput,
} from './admin-maintenance.types';
import { validateMaintenanceFilters } from './admin-maintenance-validation';

export const MAINTENANCE_PAGE_SIZE = 20;

export async function getAdminMaintenance(
  input: AdminMaintenanceInput,
  token: string,
  signal?: AbortSignal,
): Promise<AdminMaintenanceDto> {
  if (!Number.isInteger(input.page) || input.page < 1 || input.page > 100_000)
    throw new ApiRequestError(
      '조회할 페이지를 확인해 주세요.',
      400,
      'INVALID_MAINTENANCE_PAGE',
    );
  const errors = validateMaintenanceFilters(input);
  if (Object.keys(errors).length)
    throw new ApiRequestError(
      Object.values(errors)[0] ?? '청소·정비 조회 조건을 확인해 주세요.',
      400,
      'INVALID_MAINTENANCE_FILTER',
    );
  const query = new URLSearchParams({
    page: String(input.page),
    limit: String(MAINTENANCE_PAGE_SIZE),
    dateField: input.dateField,
    view: input.view,
  });
  if (input.propertyId !== undefined)
    query.set('propertyId', input.propertyId.toLowerCase());
  if (input.from !== undefined) query.set('from', input.from);
  if (input.to !== undefined) query.set('to', input.to);
  const value = await apiRequest<unknown>(`/admin/maintenance?${query}`, {
    token,
    signal,
  });
  return readMaintenancePage(value, input, MAINTENANCE_PAGE_SIZE);
}
