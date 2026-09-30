import { apiRequest } from '../../core/api/api-client';
import { ApiRequestError } from '../../core/api/api-error';
import type {
  AdminPropertyDto,
  AdminPropertyListDto,
  CreateAdminPropertyInput,
  GetAdminPropertiesInput,
  UpdateAdminPropertyInput,
} from './admin-property-management.types';
import { isPropertyId } from './admin-property-management-validation';

export const PROPERTY_PAGE_SIZE = 12;
const MAX_PAGE = 100_000;

function invalidResponse(): ApiRequestError {
  return new ApiRequestError(
    '휴양소 응답을 확인할 수 없습니다. 최신 정보를 다시 불러와 주세요.',
    200,
    'INVALID_PROPERTY_RESPONSE',
  );
}

function requireId(value: string): string {
  if (!isPropertyId(value))
    throw new ApiRequestError(
      '휴양소 정보를 확인해 주세요.',
      400,
      'INVALID_PROPERTY_ID',
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
  return Number.isFinite(time) && new Date(time).toISOString() === value;
}

function readStaff(
  value: unknown,
  staffUserId: string | null,
): AdminPropertyDto['staff'] {
  if (staffUserId === null) {
    if (value !== null) throw invalidResponse();
    return null;
  }
  if (
    !isRecord(value) ||
    !isPropertyId(value.id) ||
    value.id.toLowerCase() !== staffUserId.toLowerCase() ||
    !isText(value.name) ||
    !isNullableText(value.phone) ||
    typeof value.isActive !== 'boolean'
  )
    throw invalidResponse();
  return {
    id: value.id.toLowerCase(),
    name: value.name,
    phone: value.phone,
    isActive: value.isActive,
  };
}

export function readAdminProperty(
  value: unknown,
  expectedId?: string,
): AdminPropertyDto {
  if (
    !isRecord(value) ||
    !isPropertyId(value.id) ||
    (expectedId !== undefined && value.id.toLowerCase() !== expectedId) ||
    !isText(value.name) ||
    !isNullableText(value.region) ||
    typeof value.isActive !== 'boolean' ||
    (value.staffUserId !== null && !isPropertyId(value.staffUserId)) ||
    typeof value.vehicleRegistrationEnabled !== 'boolean' ||
    !isTimestamp(value.createdAt) ||
    !isTimestamp(value.updatedAt)
  )
    throw invalidResponse();
  return {
    id: value.id.toLowerCase(),
    name: value.name,
    region: value.region,
    isActive: value.isActive,
    staffUserId: value.staffUserId?.toLowerCase() ?? null,
    vehicleRegistrationEnabled: value.vehicleRegistrationEnabled,
    staff: readStaff(value.staff, value.staffUserId),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function readPage(
  value: unknown,
  input: GetAdminPropertiesInput,
): AdminPropertyListDto {
  if (
    !isRecord(value) ||
    !Array.isArray(value.items) ||
    value.page !== input.page ||
    value.limit !== PROPERTY_PAGE_SIZE ||
    typeof value.total !== 'number' ||
    !Number.isSafeInteger(value.total) ||
    value.total < 0 ||
    typeof value.totalPages !== 'number' ||
    value.totalPages !== Math.ceil(value.total / PROPERTY_PAGE_SIZE) ||
    value.totalPages > MAX_PAGE ||
    value.items.length !==
      Math.max(
        0,
        Math.min(
          PROPERTY_PAGE_SIZE,
          value.total - (input.page - 1) * PROPERTY_PAGE_SIZE,
        ),
      )
  )
    throw invalidResponse();
  const items = value.items.map((item) => readAdminProperty(item));
  if (
    new Set(items.map((item) => item.id)).size !== items.length ||
    (input.isActive !== undefined &&
      items.some((item) => item.isActive !== input.isActive))
  )
    throw invalidResponse();
  // A deletion/filter change can leave the requested page beyond the last page.
  // Its valid empty response lets the screen move back to the current last page.
  return {
    items,
    total: value.total,
    page: input.page,
    limit: PROPERTY_PAGE_SIZE,
    totalPages: value.totalPages,
  };
}

function requireSavedFields(
  property: AdminPropertyDto,
  input: CreateAdminPropertyInput | UpdateAdminPropertyInput,
) {
  if (
    (input.name !== undefined && property.name !== input.name.trim()) ||
    (input.region !== undefined &&
      property.region !== (input.region?.trim() || null)) ||
    (input.vehicleRegistrationEnabled !== undefined &&
      property.vehicleRegistrationEnabled !== input.vehicleRegistrationEnabled)
  )
    throw invalidResponse();
}

export async function getAdminProperties(
  input: GetAdminPropertiesInput,
  token: string,
  signal?: AbortSignal,
): Promise<AdminPropertyListDto> {
  if (
    !Number.isInteger(input.page) ||
    input.page < 1 ||
    input.page > MAX_PAGE ||
    (input.search !== undefined &&
      (typeof input.search !== 'string' ||
        [...input.search.trim()].length > 100)) ||
    (input.isActive !== undefined && typeof input.isActive !== 'boolean')
  )
    throw new ApiRequestError(
      '휴양소 검색 조건을 확인해 주세요.',
      400,
      'INVALID_PROPERTY_FILTER',
    );
  const query = new URLSearchParams({
    page: String(input.page),
    limit: String(PROPERTY_PAGE_SIZE),
  });
  if (input.search?.trim()) query.set('search', input.search.trim());
  if (input.isActive !== undefined)
    query.set('isActive', String(input.isActive));
  const value = await apiRequest<unknown>(`/admin/properties?${query}`, {
    token,
    signal,
  });
  return readPage(value, input);
}

export async function getAdminProperty(
  id: string,
  token: string,
  signal?: AbortSignal,
): Promise<AdminPropertyDto> {
  const propertyId = requireId(id);
  const value = await apiRequest<unknown>(`/admin/properties/${propertyId}`, {
    token,
    signal,
  });
  return readAdminProperty(value, propertyId);
}

export async function createAdminProperty(
  input: CreateAdminPropertyInput,
  token: string,
  signal?: AbortSignal,
): Promise<AdminPropertyDto> {
  const value = await apiRequest<unknown>('/admin/properties', {
    method: 'POST',
    token,
    signal,
    body: {
      name: input.name,
      ...(input.region === undefined ? {} : { region: input.region }),
      ...(input.vehicleRegistrationEnabled === undefined
        ? {}
        : { vehicleRegistrationEnabled: input.vehicleRegistrationEnabled }),
    },
  });
  const property = readAdminProperty(value);
  if (
    !property.isActive ||
    property.staffUserId !== null ||
    (input.region === undefined && property.region !== null) ||
    (input.vehicleRegistrationEnabled === undefined &&
      property.vehicleRegistrationEnabled)
  )
    throw invalidResponse();
  requireSavedFields(property, input);
  return property;
}

export async function updateAdminProperty(
  id: string,
  input: UpdateAdminPropertyInput,
  token: string,
  signal?: AbortSignal,
): Promise<AdminPropertyDto> {
  const propertyId = requireId(id);
  const value = await apiRequest<unknown>(
    `/admin/properties/${propertyId}/update`,
    {
      method: 'POST',
      token,
      signal,
      body: {
        ...(input.name === undefined ? {} : { name: input.name }),
        ...(input.region === undefined ? {} : { region: input.region }),
        ...(input.vehicleRegistrationEnabled === undefined
          ? {}
          : { vehicleRegistrationEnabled: input.vehicleRegistrationEnabled }),
        ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
      },
    },
  );
  const property = readAdminProperty(value, propertyId);
  if (input.isActive !== undefined && property.isActive !== input.isActive)
    throw invalidResponse();
  requireSavedFields(property, input);
  return property;
}
