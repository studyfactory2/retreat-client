import { ApiRequestError } from '../../core/api/api-error';

export const submissionTypes = [
  'CHECK_IN',
  'CHECK_OUT',
  'MAINTENANCE',
] as const;
export const submissionStatuses = ['SUBMITTED', 'CANCELLED'] as const;
export const submissionActorSources = [
  'ADMIN_SESSION',
  'GUEST_QR',
  'STAFF_QR',
  'PRIVATE_LINK',
  'SYSTEM',
] as const;

export function invalidSubmissionResponse(): ApiRequestError {
  return new ApiRequestError(
    '체크리스트 응답을 확인하지 못했습니다. 다시 불러와 주세요.',
    200,
    'INVALID_SUBMISSION_RESPONSE',
  );
}

export function isSubmissionId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export function isSubmissionDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function readObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw invalidSubmissionResponse();
  return value as Record<string, unknown>;
}

export function readId(value: unknown): string {
  if (!isSubmissionId(value)) throw invalidSubmissionResponse();
  return value.toLowerCase();
}

export function readNullableId(value: unknown): string | null {
  return value === null ? null : readId(value);
}

export function readText(
  value: unknown,
  maximum = Number.MAX_SAFE_INTEGER,
  nonempty = false,
): string {
  if (
    typeof value !== 'string' ||
    [...value].length > maximum ||
    (nonempty && !value.trim())
  )
    throw invalidSubmissionResponse();
  return value;
}

export function readNullableText(
  value: unknown,
  maximum = Number.MAX_SAFE_INTEGER,
): string | null {
  return value === null ? null : readText(value, maximum);
}

export function readInteger(
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
    throw invalidSubmissionResponse();
  return value;
}

export function readBoolean(value: unknown): boolean {
  if (typeof value !== 'boolean') throw invalidSubmissionResponse();
  return value;
}

export function readEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T {
  const found = allowed.find((item) => item === value);
  if (found === undefined) throw invalidSubmissionResponse();
  return found;
}

export function readTimestamp(value: unknown): string {
  if (typeof value !== 'string') throw invalidSubmissionResponse();
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== value)
    throw invalidSubmissionResponse();
  return value;
}

export function readNullableTimestamp(value: unknown): string | null {
  return value === null ? null : readTimestamp(value);
}

export function readVisitDate(value: unknown): string {
  if (!isSubmissionDate(value) || value < '1900-01-01' || value > '2100-12-31')
    throw invalidSubmissionResponse();
  return value;
}

export function readArray(
  value: unknown,
  maximum: number,
  minimum = 0,
): unknown[] {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum)
    throw invalidSubmissionResponse();
  return value;
}

export function requireSubmissionId(value: string): string {
  if (!isSubmissionId(value))
    throw new ApiRequestError(
      '체크리스트 조회 주소를 확인해 주세요.',
      400,
      'INVALID_SUBMISSION_ID',
    );
  return value.toLowerCase();
}

export function requireSubmissionPage(value: number): void {
  if (!Number.isInteger(value) || value < 1 || value > 100_000)
    throw new ApiRequestError(
      '조회할 페이지를 확인해 주세요.',
      400,
      'INVALID_SUBMISSION_PAGE',
    );
}

export function readSubmissionPage<T>(
  value: unknown,
  page: number,
  limit: number,
  read: (item: unknown) => T,
) {
  const data = readObject(value);
  const total = readInteger(data.total);
  if (
    data.page !== page ||
    data.limit !== limit ||
    data.totalPages !== Math.ceil(total / limit)
  )
    throw invalidSubmissionResponse();
  const items = readArray(data.items, limit).map(read);
  if (items.length !== Math.min(limit, Math.max(0, total - (page - 1) * limit)))
    throw invalidSubmissionResponse();
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}
