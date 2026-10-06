import { ApiRequestError } from '../../core/api/api-error';

export function isStaffQrToken(value: unknown): value is string {
  // Canonical encoding of 32 bytes: the last character's unused bits are zero.
  // Actual credential scope and access remain the backend's responsibility.
  return (
    typeof value === 'string' &&
    value.length === 43 &&
    /^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/.test(value)
  );
}

export function requireStaffQrToken(value: unknown): asserts value is string {
  if (!isStaffQrToken(value))
    throw new ApiRequestError(
      '직원용 링크 형식을 확인해 주세요. 안내받은 QR을 다시 열어 주세요.',
      400,
      'INVALID_STAFF_QR_INPUT',
    );
}

export function isStaffEntryId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length === 36 &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export function isStaffEntryVersion(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 2_147_483_647
  );
}

export function isStaffEntryText(
  value: unknown,
  maximum: number,
): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value === value.trim() &&
    [...value].length <= maximum
  );
}

export function invalidStaffEntryResponse(): ApiRequestError {
  return new ApiRequestError(
    '직원 안내 응답을 확인할 수 없습니다. 잠시 후 다시 불러와 주세요.',
    200,
    'INVALID_STAFF_ENTRY_RESPONSE',
  );
}

export function readStaffEntryObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw invalidStaffEntryResponse();
  return value as Record<string, unknown>;
}
