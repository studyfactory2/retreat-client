import { apiRequest } from '../../core/api/api-client';
import { ApiRequestError } from '../../core/api/api-error';
import { readAdminProperty } from './admin-property-management-api';
import { isPropertyId } from './admin-property-management-validation';
import type { PropertyOperationPreview } from './admin-property-operation.types';

function invalidResponse(): never {
  throw new ApiRequestError(
    '운영 상태를 확인하지 못했습니다. 다시 확인해 주세요.',
    200,
    'INVALID_OPERATION_RESPONSE',
  );
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isTimestamp(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}
function requireId(id: string) {
  if (!isPropertyId(id))
    throw new ApiRequestError(
      '휴양소를 확인해 주세요.',
      400,
      'INVALID_PROPERTY_ID',
    );
  return id.toLowerCase();
}

export async function getPropertyOperation(
  id: string,
  token: string,
  signal: AbortSignal,
): Promise<PropertyOperationPreview> {
  const propertyId = requireId(id);
  const value = await apiRequest<unknown>(
    `/admin/properties/${propertyId}/operation`,
    { token, signal },
  );
  if (
    !isRecord(value) ||
    !isTimestamp(value.checkedAt) ||
    typeof value.blockingStayCount !== 'number' ||
    !Number.isSafeInteger(value.blockingStayCount) ||
    value.blockingStayCount < 0 ||
    !Array.isArray(value.stays) ||
    value.stays.length !== Math.min(5, value.blockingStayCount)
  )
    return invalidResponse();
  const checkedAt = value.checkedAt;
  const stays = value.stays.map((stay) => {
    if (
      !isRecord(stay) ||
      !isPropertyId(stay.id) ||
      typeof stay.guestName !== 'string' ||
      !stay.guestName.trim() ||
      !isTimestamp(stay.checkInAt) ||
      !isTimestamp(stay.checkOutAt) ||
      Date.parse(stay.checkOutAt) <= Date.parse(checkedAt) ||
      Date.parse(stay.checkInAt) >= Date.parse(stay.checkOutAt)
    )
      return invalidResponse();
    return {
      id: stay.id.toLowerCase(),
      guestName: stay.guestName,
      checkInAt: stay.checkInAt,
      checkOutAt: stay.checkOutAt,
    };
  });
  if (new Set(stays.map((stay) => stay.id)).size !== stays.length)
    return invalidResponse();
  return {
    property: readAdminProperty(value.property, propertyId),
    checkedAt,
    blockingStayCount: value.blockingStayCount,
    stays,
  };
}

export async function changePropertyOperation(
  id: string,
  isActive: boolean,
  expectedUpdatedAt: string,
  token: string,
  signal: AbortSignal,
) {
  const propertyId = requireId(id);
  if (typeof isActive !== 'boolean' || !isTimestamp(expectedUpdatedAt))
    throw new ApiRequestError(
      '최신 정보를 다시 확인해 주세요.',
      400,
      'INVALID_OPERATION_INPUT',
    );
  const value = await apiRequest<unknown>(
    `/admin/properties/${propertyId}/operation`,
    {
      method: 'POST',
      token,
      signal,
      body: { isActive, expectedUpdatedAt },
    },
  );
  const property = readAdminProperty(value, propertyId);
  if (
    property.isActive !== isActive ||
    Date.parse(property.updatedAt) <= Date.parse(expectedUpdatedAt)
  )
    return invalidResponse();
  return property;
}
