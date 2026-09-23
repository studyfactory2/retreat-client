import { apiRequest } from '../../core/api/api-client';
import { ApiRequestError } from '../../core/api/api-error';
import type {
  AdminStayDto,
  CreateAdminStayInput,
  UpdateAdminStayInput,
} from './admin-stays.types';
import { isStayId, isStayRevision } from './admin-stays-validation';

function invalidResponse(): ApiRequestError {
  return new ApiRequestError(
    '이용 일정의 응답을 확인할 수 없습니다. 최신 기록을 확인해 주세요.',
    200,
    'INVALID_STAY_RESPONSE',
  );
}

function requireId(value: string): string {
  if (!isStayId(value))
    throw new ApiRequestError(
      '이용 일정 또는 휴양소 정보를 확인해 주세요.',
      400,
      'INVALID_STAY_ID',
    );
  return value.toLowerCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNullableText(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const time = Date.parse(value);
  return (
    Number.isFinite(time) &&
    Number.isFinite(new Date(time + 9 * 60 * 60 * 1_000).getTime()) &&
    new Date(time).toISOString() === value
  );
}

function readStay(value: unknown, expectedId?: string): AdminStayDto {
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
    typeof value.property.isActive !== 'boolean' ||
    !isRecord(value.createdBy) ||
    !isStayId(value.createdBy.id) ||
    value.createdBy.id.toLowerCase() !== value.createdByUserId.toLowerCase() ||
    !isText(value.createdBy.name)
  )
    throw invalidResponse();

  if (
    (value.status === 'ACTIVE' &&
      (value.cancelledAt !== null || value.cancellationReason !== null)) ||
    (value.status === 'CANCELLED' &&
      (value.cancelledAt === null || !isText(value.cancellationReason)))
  )
    throw invalidResponse();

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
    createdBy: {
      id: value.createdBy.id.toLowerCase(),
      name: value.createdBy.name,
    },
  };
}

function optionalFields(input: CreateAdminStayInput | UpdateAdminStayInput) {
  return {
    ...(input.company === undefined ? {} : { company: input.company }),
    ...(input.department === undefined ? {} : { department: input.department }),
    ...(input.phone === undefined ? {} : { phone: input.phone }),
    ...(input.notes === undefined ? {} : { notes: input.notes }),
  };
}

function requireSavedFields(
  stay: AdminStayDto,
  input: CreateAdminStayInput | UpdateAdminStayInput,
) {
  if (
    (input.guestName !== undefined &&
      stay.guestName !== input.guestName.trim()) ||
    (input.checkInAt !== undefined &&
      Date.parse(stay.checkInAt) !== Date.parse(input.checkInAt)) ||
    (input.checkOutAt !== undefined &&
      Date.parse(stay.checkOutAt) !== Date.parse(input.checkOutAt))
  )
    throw invalidResponse();
  for (const field of ['company', 'department', 'phone', 'notes'] as const) {
    if (
      input[field] !== undefined &&
      stay[field] !== (input[field]?.trim() || null)
    )
      throw invalidResponse();
  }
}

export async function getAdminStay(
  id: string,
  token: string,
  signal?: AbortSignal,
): Promise<AdminStayDto> {
  const stayId = requireId(id);
  const value = await apiRequest<unknown>(`/admin/stays/${stayId}`, {
    token,
    signal,
  });
  return readStay(value, stayId);
}

export async function createAdminStay(
  input: CreateAdminStayInput,
  token: string,
  signal?: AbortSignal,
): Promise<AdminStayDto> {
  const propertyId = requireId(input.propertyId);
  const value = await apiRequest<unknown>('/admin/stays', {
    method: 'POST',
    token,
    signal,
    body: {
      propertyId,
      guestName: input.guestName,
      checkInAt: input.checkInAt,
      checkOutAt: input.checkOutAt,
      ...optionalFields(input),
    },
  });
  const stay = readStay(value);
  if (
    stay.propertyId !== propertyId ||
    stay.status !== 'ACTIVE' ||
    stay.source !== 'MANUAL' ||
    stay.currentRevision !== 1
  )
    throw invalidResponse();
  requireSavedFields(stay, input);
  return stay;
}

export async function updateAdminStay(
  id: string,
  input: UpdateAdminStayInput,
  token: string,
  signal?: AbortSignal,
): Promise<AdminStayDto> {
  const stayId = requireId(id);
  if (!isStayRevision(input.expectedRevision))
    throw new ApiRequestError(
      '최신 이용 일정을 불러온 뒤 다시 수정해 주세요.',
      400,
      'INVALID_STAY_REVISION',
    );
  const value = await apiRequest<unknown>(`/admin/stays/${stayId}/update`, {
    method: 'POST',
    token,
    signal,
    body: {
      expectedRevision: input.expectedRevision,
      ...(input.guestName === undefined ? {} : { guestName: input.guestName }),
      ...(input.checkInAt === undefined ? {} : { checkInAt: input.checkInAt }),
      ...(input.checkOutAt === undefined
        ? {}
        : { checkOutAt: input.checkOutAt }),
      ...(input.reason === undefined ? {} : { reason: input.reason }),
      ...optionalFields(input),
    },
  });
  const stay = readStay(value, stayId);
  if (
    stay.status !== 'ACTIVE' ||
    stay.currentRevision !== input.expectedRevision + 1
  )
    throw invalidResponse();
  requireSavedFields(stay, input);
  return stay;
}
