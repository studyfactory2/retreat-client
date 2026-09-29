import { ApiRequestError } from '../../core/api/api-error';
import type { AdminIssueFilters } from './admin-issues.types';

export const issueStatuses = ['NEW', 'IN_PROGRESS', 'RESOLVED'] as const;
export const issueEventTypes = [
  'REPORTED',
  'UPDATED',
  'STATUS_CHANGED',
  'REPAIR_REPORTED',
  'RESOLVED',
  'REOPENED',
  'CANCELLED',
  'RESTORED',
] as const;
export const issueActorSources = [
  'ADMIN_SESSION',
  'GUEST_QR',
  'STAFF_QR',
  'PRIVATE_LINK',
  'SYSTEM',
] as const;
export type IssueFilterErrors = Partial<
  Record<'propertyId' | 'status' | 'isUrgent' | 'from' | 'to', string>
>;

export function isIssueId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function isIssueDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

export function validateIssueFilters(
  filters: AdminIssueFilters,
): IssueFilterErrors {
  const errors: IssueFilterErrors = {};
  if (filters.propertyId !== undefined && !isIssueId(filters.propertyId))
    errors.propertyId = '조회할 휴양소를 다시 선택해 주세요.';
  if (
    filters.status !== undefined &&
    !issueStatuses.some((status) => status === filters.status)
  )
    errors.status = '처리 상태를 다시 선택해 주세요.';
  if (
    filters.isUrgent !== undefined &&
    filters.isUrgent !== 'true' &&
    filters.isUrgent !== 'false'
  )
    errors.isUrgent = '긴급 여부를 다시 선택해 주세요.';
  if (filters.from !== undefined && !isIssueDate(filters.from))
    errors.from = '시작 접수일을 올바른 YYYY-MM-DD 날짜로 입력해 주세요.';
  if (filters.to !== undefined && !isIssueDate(filters.to))
    errors.to = '종료 접수일을 올바른 YYYY-MM-DD 날짜로 입력해 주세요.';
  if (
    !errors.from &&
    !errors.to &&
    filters.from !== undefined &&
    filters.to !== undefined &&
    filters.from > filters.to
  )
    errors.to = '종료 접수일은 시작 접수일과 같거나 이후여야 합니다.';
  return errors;
}

export function invalidIssueResponse(): ApiRequestError {
  return new ApiRequestError(
    '이상사항 기록을 확인하지 못했습니다. 다시 불러와 주세요.',
    200,
    'INVALID_ISSUE_RESPONSE',
  );
}

export function readIssueObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw invalidIssueResponse();
  return value as Record<string, unknown>;
}

export function readIssueId(value: unknown): string {
  if (!isIssueId(value)) throw invalidIssueResponse();
  return value.toLowerCase();
}

export function readNullableIssueId(value: unknown): string | null {
  return value === null ? null : readIssueId(value);
}

export function readIssueText(
  value: unknown,
  maximum = Number.MAX_SAFE_INTEGER,
  nonempty = false,
): string {
  if (
    typeof value !== 'string' ||
    [...value].length > maximum ||
    (nonempty && !value.trim())
  )
    throw invalidIssueResponse();
  return value;
}

export function readNullableIssueText(
  value: unknown,
  maximum: number,
): string | null {
  return value === null ? null : readIssueText(value, maximum);
}

export function readIssueInteger(
  value: unknown,
  minimum = 0,
  maximum = Number.MAX_SAFE_INTEGER,
): number {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < minimum ||
    value > maximum
  )
    throw invalidIssueResponse();
  return value;
}

export function readIssueEnum<T extends string>(
  value: unknown,
  values: readonly T[],
): T {
  const found = values.find((candidate) => candidate === value);
  if (found === undefined) throw invalidIssueResponse();
  return found;
}

export function readIssueTimestamp(value: unknown): string {
  const result = readIssueText(value);
  const parsed = new Date(result);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== result)
    throw invalidIssueResponse();
  return result;
}

export function readNullableIssueTimestamp(value: unknown): string | null {
  return value === null ? null : readIssueTimestamp(value);
}

export function requireIssueId(value: string): string {
  if (!isIssueId(value))
    throw new ApiRequestError(
      '이상사항 조회 주소를 확인해 주세요.',
      400,
      'INVALID_ISSUE_ID',
    );
  return value.toLowerCase();
}

export function requireIssuePage(value: number): void {
  if (!Number.isInteger(value) || value < 1 || value > 100_000)
    throw new ApiRequestError(
      '조회할 페이지를 확인해 주세요.',
      400,
      'INVALID_ISSUE_PAGE',
    );
}

export function readIssuePage<T>(
  value: unknown,
  page: number,
  limit: number,
  read: (item: unknown) => T,
) {
  const data = readIssueObject(value);
  const total = readIssueInteger(data.total);
  if (
    data.page !== page ||
    data.limit !== limit ||
    data.totalPages !== Math.ceil(total / limit) ||
    !Array.isArray(data.items) ||
    data.items.length !==
      Math.min(limit, Math.max(0, total - (page - 1) * limit))
  )
    throw invalidIssueResponse();
  return {
    items: data.items.map(read),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
