import { apiRequest } from '../../core/api/api-client';
import type {
  AdminStaffDto,
  AdminStaffListDto,
  CreateAdminStaffInput,
  GetAdminStaffInput,
  UpdateAdminStaffInput,
} from './admin-staff.types';
import {
  readAdminStaff,
  readAdminStaffPage,
  verifySavedStaffFields,
} from './admin-staff-readers';
import {
  invalidStaffResponse,
  prepareCreateAdminStaff,
  prepareStaffFilters,
  prepareUpdateAdminStaff,
  requireStaffId,
  STAFF_PAGE_SIZE,
} from './admin-staff-validation';

export { STAFF_PAGE_SIZE } from './admin-staff-validation';

export async function getAdminStaffList(
  input: GetAdminStaffInput,
  token: string,
  signal?: AbortSignal,
): Promise<AdminStaffListDto> {
  const filters = prepareStaffFilters(input);
  const query = new URLSearchParams({
    page: String(filters.page),
    limit: String(STAFF_PAGE_SIZE),
  });
  if (filters.search !== undefined) query.set('search', filters.search);
  if (filters.isActive !== undefined)
    query.set('isActive', String(filters.isActive));
  return readAdminStaffPage(
    await apiRequest<unknown>(`/admin/staff?${query}`, { token, signal }),
    filters,
  );
}

export async function getAdminStaff(
  id: string,
  token: string,
  signal?: AbortSignal,
): Promise<AdminStaffDto> {
  const staffId = requireStaffId(id);
  return readAdminStaff(
    await apiRequest<unknown>(`/admin/staff/${staffId}`, { token, signal }),
    staffId,
  );
}

export async function createAdminStaff(
  input: CreateAdminStaffInput,
  token: string,
  signal?: AbortSignal,
): Promise<AdminStaffDto> {
  const body = prepareCreateAdminStaff(input);
  const staff = readAdminStaff(
    await apiRequest<unknown>('/admin/staff', {
      method: 'POST',
      token,
      signal,
      body: { ...body },
    }),
  );
  verifySavedStaffFields(staff, body);
  if (
    !staff.isActive ||
    staff.assignedProperties.length > 0 ||
    (['phone', 'company', 'department'] as const).some(
      (field) => body[field] === undefined && staff[field] !== null,
    )
  )
    throw invalidStaffResponse();
  return staff;
}

export async function updateAdminStaff(
  id: string,
  input: UpdateAdminStaffInput,
  token: string,
  signal?: AbortSignal,
): Promise<AdminStaffDto> {
  const staffId = requireStaffId(id);
  const body = prepareUpdateAdminStaff(input);
  const staff = readAdminStaff(
    await apiRequest<unknown>(`/admin/staff/${staffId}/update`, {
      method: 'POST',
      token,
      signal,
      body: { ...body },
    }),
    staffId,
  );
  verifySavedStaffFields(staff, body);
  if (body.isActive === false && staff.assignedProperties.length > 0)
    throw invalidStaffResponse();
  return staff;
}
