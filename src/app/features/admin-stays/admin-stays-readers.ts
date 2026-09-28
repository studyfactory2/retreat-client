import { ApiRequestError } from '../../core/api/api-error';
import type { AdminStayDto } from './admin-stays.types';
import { isStayId } from './admin-stays-validation';

export function invalidStayResponse(): ApiRequestError {
  return new ApiRequestError(
    '이용 일정의 응답을 확인할 수 없습니다. 최신 기록을 확인해 주세요.',
    200,
    'INVALID_STAY_RESPONSE',
  );
}

export function requireStayId(value: string): string {
  if (!isStayId(value))
    throw new ApiRequestError(
      '이용 일정 또는 휴양소 정보를 확인해 주세요.',
      400,
      'INVALID_STAY_ID',
    );
  return value.toLowerCase();
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isNullableText(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

export function isTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const time = Date.parse(value);
  return (
    Number.isFinite(time) &&
    Number.isFinite(new Date(time + 9 * 60 * 60 * 1_000).getTime()) &&
    new Date(time).toISOString() === value
  );
}

export function readStayFields(
  value: unknown,
  expectedId?: string,
): Omit<AdminStayDto, 'createdBy'> {
  if (
    !isRecord(value) ||
    !isStayId(value.id) ||
    (expectedId !== undefined && value.id.toLowerCase() !== expectedId) ||
    !isStayId(value.propertyId) ||
    (value.guestUserId !== null && !isStayId(value.guestUserId)) ||
    !isText(value.guestName) ||
    !isNullableText(value.company) ||
    !isNullableText(value.department) ||
    !isNullableText(value.phone) ||
    !isNullableText(value.notes) ||
    !isTimestamp(value.checkInAt) ||
    !isTimestamp(value.checkOutAt) ||
    Date.parse(value.checkInAt) >= Date.parse(value.checkOutAt) ||
    (value.status !== 'ACTIVE' && value.status !== 'CANCELLED') ||
    (value.source !== 'MANUAL' && value.source !== 'EXCEL') ||
    !isStayId(value.createdByUserId) ||
    typeof value.currentRevision !== 'number' ||
    !Number.isInteger(value.currentRevision) ||
    value.currentRevision < 1 ||
    value.currentRevision > 2_147_483_647 ||
    (value.cancelledAt !== null && !isTimestamp(value.cancelledAt)) ||
    !isNullableText(value.cancellationReason) ||
    !isTimestamp(value.createdAt) ||
    !isTimestamp(value.updatedAt) ||
    !isRecord(value.property) ||
    !isStayId(value.property.id) ||
    value.property.id.toLowerCase() !== value.propertyId.toLowerCase() ||
    !isText(value.property.name) ||
    !isNullableText(value.property.region) ||
    typeof value.property.isActive !== 'boolean'
  )
    throw invalidStayResponse();

  if (
    (value.status === 'ACTIVE' &&
      (value.cancelledAt !== null || value.cancellationReason !== null)) ||
    (value.status === 'CANCELLED' &&
      (value.cancelledAt === null || !isText(value.cancellationReason)))
  )
    throw invalidStayResponse();

  return {
    id: value.id.toLowerCase(),
    propertyId: value.propertyId.toLowerCase(),
    guestUserId: value.guestUserId?.toLowerCase() ?? null,
    guestName: value.guestName,
    company: value.company,
    department: value.department,
    phone: value.phone,
    checkInAt: value.checkInAt,
    checkOutAt: value.checkOutAt,
    status: value.status,
    source: value.source,
    notes: value.notes,
    createdByUserId: value.createdByUserId.toLowerCase(),
    currentRevision: value.currentRevision,
    cancelledAt: value.cancelledAt,
    cancellationReason: value.cancellationReason,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    property: {
      id: value.property.id.toLowerCase(),
      name: value.property.name,
      region: value.property.region,
      isActive: value.property.isActive,
    },
  };
}

export function readStay(value: unknown, expectedId?: string): AdminStayDto {
  const stay = readStayFields(value, expectedId);
  if (
    !isRecord(value) ||
    !isRecord(value.createdBy) ||
    !isStayId(value.createdBy.id) ||
    value.createdBy.id.toLowerCase() !== stay.createdByUserId ||
    !isText(value.createdBy.name)
  )
    throw invalidStayResponse();
  return {
    ...stay,
    createdBy: {
      id: value.createdBy.id.toLowerCase(),
      name: value.createdBy.name,
    },
  };
}
