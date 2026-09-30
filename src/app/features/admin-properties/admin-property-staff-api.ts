import { apiRequest } from '../../core/api/api-client';
import { ApiRequestError } from '../../core/api/api-error';
import { requireStaffId } from '../admin-staff/admin-staff-validation';
import { readAdminProperty } from './admin-property-management-api';
import { isPropertyId } from './admin-property-management-validation';
import type { AdminPropertyDto } from './admin-property-management.types';

export async function assignAdminPropertyStaff(
  propertyId: string,
  staffUserId: string | null,
  token: string,
  signal?: AbortSignal,
): Promise<AdminPropertyDto> {
  if (!isPropertyId(propertyId))
    throw new ApiRequestError(
      '휴양소 정보를 확인해 주세요.',
      400,
      'INVALID_PROPERTY_ID',
    );
  const id = propertyId.toLowerCase();
  const staffId = staffUserId === null ? null : requireStaffId(staffUserId);
  const property = readAdminProperty(
    await apiRequest<unknown>(`/admin/properties/${id}/staff`, {
      method: 'POST',
      token,
      signal,
      body: { staffUserId: staffId },
    }),
    id,
  );
  if (
    property.staffUserId !== staffId ||
    (staffId !== null && (!property.isActive || !property.staff?.isActive))
  )
    throw new ApiRequestError(
      '직원 배정 결과를 확인할 수 없습니다. 최신 휴양소 정보를 다시 불러와 주세요.',
      200,
      'INVALID_PROPERTY_ASSIGNMENT_RESPONSE',
    );
  return property;
}
