import type {
  AdminStaffDto,
  AdminStaffListDto,
  AssignedStaffPropertyDto,
  CreateAdminStaffInput,
  GetAdminStaffInput,
  UpdateAdminStaffInput,
} from './admin-staff.types';
import {
  invalidStaffResponse,
  isStaffId,
  MAX_STAFF_PAGE,
  STAFF_PAGE_SIZE,
} from './admin-staff-validation';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isText(value: unknown, limit: number): value is string {
  return (
    typeof value === 'string' &&
    value.trim() === value &&
    value.length > 0 &&
    [...value].length <= limit
  );
}

function isNullableText(value: unknown, limit: number): value is string | null {
  return value === null || isText(value, limit);
}

function isTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value;
}

function readAssignedProperty(value: unknown): AssignedStaffPropertyDto {
  if (
    !isRecord(value) ||
    !isStaffId(value.id) ||
    !isText(value.name, 100) ||
    !isNullableText(value.region, 100) ||
    typeof value.isActive !== 'boolean'
  )
    throw invalidStaffResponse();
  return {
    id: value.id.toLowerCase(),
    name: value.name,
    region: value.region,
    isActive: value.isActive,
  };
}

export function readAdminStaff(
  value: unknown,
  expectedId?: string,
): AdminStaffDto {
  if (
    !isRecord(value) ||
    !isStaffId(value.id) ||
    (expectedId !== undefined &&
      value.id.toLowerCase() !== expectedId.toLowerCase()) ||
    !isText(value.name, 100) ||
    value.role !== 'STAFF' ||
    !isNullableText(value.phone, 32) ||
    !isNullableText(value.company, 100) ||
    !isNullableText(value.department, 100) ||
    typeof value.isActive !== 'boolean' ||
    !isTimestamp(value.createdAt) ||
    !isTimestamp(value.updatedAt) ||
    Date.parse(value.updatedAt) < Date.parse(value.createdAt) ||
    !Array.isArray(value.assignedProperties)
  )
    throw invalidStaffResponse();
  const assignedProperties = value.assignedProperties.map(readAssignedProperty);
  if (
    new Set(assignedProperties.map((property) => property.id)).size !==
    assignedProperties.length
  )
    throw invalidStaffResponse();
  if (
    assignedProperties.some((property, index, properties) => {
      const previous = properties[index - 1];
      return (
        previous !== undefined &&
        previous.name === property.name &&
        previous.id >= property.id
      );
    })
  )
    throw invalidStaffResponse();
  return {
    id: value.id.toLowerCase(),
    name: value.name,
    role: 'STAFF',
    phone: value.phone,
    company: value.company,
    department: value.department,
    isActive: value.isActive,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    assignedProperties,
  };
}

export function readAdminStaffPage(
  value: unknown,
  input: GetAdminStaffInput,
): AdminStaffListDto {
  if (
    !isRecord(value) ||
    !Array.isArray(value.items) ||
    value.page !== input.page ||
    value.limit !== STAFF_PAGE_SIZE ||
    typeof value.total !== 'number' ||
    !Number.isSafeInteger(value.total) ||
    value.total < 0 ||
    typeof value.totalPages !== 'number' ||
    value.totalPages !== Math.ceil(value.total / STAFF_PAGE_SIZE) ||
    value.totalPages > MAX_STAFF_PAGE ||
    value.items.length !==
      Math.max(
        0,
        Math.min(
          STAFF_PAGE_SIZE,
          value.total - (input.page - 1) * STAFF_PAGE_SIZE,
        ),
      )
  )
    throw invalidStaffResponse();
  const items = value.items.map((item) => readAdminStaff(item));
  if (
    new Set(items.map((item) => item.id)).size !== items.length ||
    items.some((item, index) => {
      const previous = items[index - 1];
      return (
        (input.isActive !== undefined && item.isActive !== input.isActive) ||
        (previous !== undefined &&
          (Date.parse(previous.createdAt) < Date.parse(item.createdAt) ||
            (previous.createdAt === item.createdAt && previous.id <= item.id)))
      );
    })
  )
    throw invalidStaffResponse();
  return {
    items,
    total: value.total,
    page: input.page,
    limit: STAFF_PAGE_SIZE,
    totalPages: value.totalPages,
  };
}

export function verifySavedStaffFields(
  staff: AdminStaffDto,
  input: CreateAdminStaffInput | UpdateAdminStaffInput,
): void {
  for (const field of ['name', 'phone', 'company', 'department'] as const)
    if (input[field] !== undefined && staff[field] !== input[field])
      throw invalidStaffResponse();
  if (
    'isActive' in input &&
    input.isActive !== undefined &&
    staff.isActive !== input.isActive
  )
    throw invalidStaffResponse();
}
