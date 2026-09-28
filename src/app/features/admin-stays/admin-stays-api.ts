import { apiRequest } from '../../core/api/api-client';
import { ApiRequestError } from '../../core/api/api-error';
import type {
  AdminStayDto,
  CreateAdminStayInput,
  UpdateAdminStayInput,
} from './admin-stays.types';
import { isStayRevision } from './admin-stays-validation';
import {
  invalidStayResponse,
  readStay,
  requireStayId,
} from './admin-stays-readers';

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
    throw invalidStayResponse();
  for (const field of ['company', 'department', 'phone', 'notes'] as const) {
    if (
      input[field] !== undefined &&
      stay[field] !== (input[field]?.trim() || null)
    )
      throw invalidStayResponse();
  }
}

export async function getAdminStay(
  id: string,
  token: string,
  signal?: AbortSignal,
): Promise<AdminStayDto> {
  const stayId = requireStayId(id);
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
  const propertyId = requireStayId(input.propertyId);
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
    throw invalidStayResponse();
  requireSavedFields(stay, input);
  return stay;
}

export async function updateAdminStay(
  id: string,
  input: UpdateAdminStayInput,
  token: string,
  signal?: AbortSignal,
): Promise<AdminStayDto> {
  const stayId = requireStayId(id);
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
    throw invalidStayResponse();
  requireSavedFields(stay, input);
  return stay;
}
