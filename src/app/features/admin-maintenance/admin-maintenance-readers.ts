import { ApiRequestError } from '../../core/api/api-error';
import type {
  AdminMaintenanceDto,
  AdminMaintenanceInput,
  AdminMaintenanceItem,
  MaintenanceReviewReason,
  MaintenanceStatus,
} from './admin-maintenance.types';
import { isMaintenanceId } from './admin-maintenance-validation';

const statuses: MaintenanceStatus[] = [
  'UNFINISHED',
  'EXPIRED',
  'ACCESS_BLOCKED',
  'COMPLETED',
  'NEEDS_REVIEW',
];
const accessReasons: MaintenanceReviewReason[] = [
  'TOKEN_UNAVAILABLE',
  'PROPERTY_INACTIVE',
  'STAFF_ASSIGNMENT_CHANGED',
  'STAFF_INACTIVE',
];
const reasons: MaintenanceReviewReason[] = [
  'INVALID_RECORD',
  'TOKEN_EXPIRED',
  ...accessReasons,
];

export function invalidMaintenanceResponse(): ApiRequestError {
  return new ApiRequestError(
    '청소·정비 기록을 확인하지 못했습니다. 다시 불러와 주세요.',
    200,
    'INVALID_MAINTENANCE_RESPONSE',
  );
}

function object(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw invalidMaintenanceResponse();
  return value as Record<string, unknown>;
}

function id(value: unknown): string {
  if (!isMaintenanceId(value)) throw invalidMaintenanceResponse();
  return value.toLowerCase();
}

function text(value: unknown): string {
  if (typeof value !== 'string') throw invalidMaintenanceResponse();
  return value;
}

function timestamp(value: unknown): string {
  const result = text(value);
  const parsed = new Date(result);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== result)
    throw invalidMaintenanceResponse();
  return result;
}

function nullableTimestamp(value: unknown): string | null {
  return value === null ? null : timestamp(value);
}

function integer(value: unknown, minimum = 0): number {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < minimum
  )
    throw invalidMaintenanceResponse();
  return value;
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[]): T {
  const match = allowed.find((candidate) => candidate === value);
  if (match === undefined) throw invalidMaintenanceResponse();
  return match;
}

function readItem(value: unknown, asOf: string): AdminMaintenanceItem {
  const data = object(value);
  const property = object(data.property);
  const staff = object(data.staff);
  if (
    typeof property.isActive !== 'boolean' ||
    !Array.isArray(data.reviewReasons)
  )
    throw invalidMaintenanceResponse();
  const item: AdminMaintenanceItem = {
    id: id(data.id),
    property: {
      id: id(property.id),
      name: text(property.name),
      region: property.region === null ? null : text(property.region),
      isActive: property.isActive,
    },
    staff: {
      id: staff.id === null ? null : id(staff.id),
      name: staff.name === null ? null : text(staff.name),
    },
    status: enumValue(data.status, statuses),
    reviewReasons: data.reviewReasons.map((value) => enumValue(value, reasons)),
    startedAt: nullableTimestamp(data.startedAt),
    updatedAt: timestamp(data.updatedAt),
    submittedAt: nullableTimestamp(data.submittedAt),
    expiresAt: nullableTimestamp(data.expiresAt),
    currentRevision: integer(data.currentRevision, Number.MIN_SAFE_INTEGER),
  };
  if (new Set(item.reviewReasons).size !== item.reviewReasons.length)
    throw invalidMaintenanceResponse();
  // Invalid legacy evidence is an intentional diagnostic result, including null
  // staff/dates or inconsistent lifecycle fields. Do not hide those records.
  if (item.status === 'NEEDS_REVIEW') {
    if (
      item.reviewReasons.length !== 1 ||
      item.reviewReasons[0] !== 'INVALID_RECORD'
    )
      throw invalidMaintenanceResponse();
    return item;
  }
  if (
    item.startedAt === null ||
    item.staff.id === null ||
    !item.staff.name?.trim() ||
    Date.parse(item.startedAt) > Date.parse(item.updatedAt)
  )
    throw invalidMaintenanceResponse();
  if (item.status === 'COMPLETED') {
    if (
      item.currentRevision < 1 ||
      item.reviewReasons.length !== 0 ||
      item.submittedAt === null ||
      item.expiresAt !== null ||
      Date.parse(item.submittedAt) < Date.parse(item.startedAt) ||
      Date.parse(item.submittedAt) > Date.parse(item.updatedAt)
    )
      throw invalidMaintenanceResponse();
    return item;
  }
  if (item.currentRevision !== 0 || item.submittedAt !== null)
    throw invalidMaintenanceResponse();
  const expired =
    item.expiresAt !== null && Date.parse(item.expiresAt) <= Date.parse(asOf);
  if (item.status === 'EXPIRED') {
    if (
      !expired ||
      item.reviewReasons.length !== 1 ||
      item.reviewReasons[0] !== 'TOKEN_EXPIRED'
    )
      throw invalidMaintenanceResponse();
  } else if (item.status === 'ACCESS_BLOCKED') {
    if (
      expired ||
      item.reviewReasons.length === 0 ||
      item.reviewReasons.some((reason) => !accessReasons.includes(reason)) ||
      item.reviewReasons.includes('PROPERTY_INACTIVE') !==
        !item.property.isActive ||
      (item.expiresAt === null &&
        !item.reviewReasons.includes('TOKEN_UNAVAILABLE'))
    )
      throw invalidMaintenanceResponse();
  } else if (
    expired ||
    item.expiresAt === null ||
    !item.property.isActive ||
    item.reviewReasons.length !== 0
  )
    throw invalidMaintenanceResponse();
  return item;
}

function selectedTime(
  item: AdminMaintenanceItem,
  dateField: string,
): string | null {
  return dateField === 'SUBMITTED' ? item.submittedAt : item.startedAt;
}

export function readMaintenancePage(
  value: unknown,
  input: AdminMaintenanceInput,
  limit: number,
): AdminMaintenanceDto {
  const data = object(value);
  const total = integer(data.total);
  const asOf = timestamp(data.asOf);
  if (
    data.timezone !== 'Asia/Seoul' ||
    data.page !== input.page ||
    data.limit !== limit ||
    data.totalPages !== Math.ceil(total / limit) ||
    !Array.isArray(data.items) ||
    data.items.length !==
      Math.min(limit, Math.max(0, total - (input.page - 1) * limit))
  )
    throw invalidMaintenanceResponse();
  const items = data.items.map((value) => readItem(value, asOf));
  if (new Set(items.map((item) => item.id)).size !== items.length)
    throw invalidMaintenanceResponse();
  items.forEach((item, index) => {
    const selected = selectedTime(item, input.dateField);
    const previous = items[index - 1];
    const previousSelected = previous
      ? selectedTime(previous, input.dateField)
      : null;
    if (
      (input.propertyId !== undefined &&
        item.property.id !== input.propertyId.toLowerCase()) ||
      (input.view === 'UNFINISHED' && item.status === 'COMPLETED') ||
      (input.view === 'COMPLETED' &&
        item.status !== 'COMPLETED' &&
        item.status !== 'NEEDS_REVIEW')
    )
      throw invalidMaintenanceResponse();
    if (input.from !== undefined && input.to !== undefined) {
      const day =
        selected === null
          ? null
          : new Date(Date.parse(selected) + 9 * 3_600_000)
              .toISOString()
              .slice(0, 10);
      if (day === null || day < input.from || day > input.to)
        throw invalidMaintenanceResponse();
    }
    if (
      previous &&
      ((previousSelected === null && selected !== null) ||
        (previousSelected !== null &&
          selected !== null &&
          Date.parse(previousSelected) < Date.parse(selected)) ||
        (previousSelected === selected && previous.id <= item.id))
    )
      throw invalidMaintenanceResponse();
  });
  return {
    items,
    total,
    page: input.page,
    limit,
    totalPages: Math.ceil(total / limit),
    asOf,
    timezone: 'Asia/Seoul',
  };
}
