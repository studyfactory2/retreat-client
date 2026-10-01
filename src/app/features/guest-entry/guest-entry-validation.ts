import { ApiRequestError } from '../../core/api/api-error';
import type { GuestAccessKind } from './guest-entry.types';

export function isGuestAccessKind(value: unknown): value is GuestAccessKind {
  return value === 'qr' || value === 'stay';
}

export function isGuestAccessToken(value: unknown): value is string {
  // 32 bytes encode to 43 unpadded base64url characters. The last character's
  // unused two bits must be zero, matching the backend's decode/encode check.
  return (
    typeof value === 'string' &&
    /^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/.test(value)
  );
}

export function requireGuestAccessInput(
  kind: unknown,
  token: unknown,
): asserts kind is GuestAccessKind {
  if (!isGuestAccessKind(kind) || !isGuestAccessToken(token))
    throw new ApiRequestError(
      '이용 링크 형식을 확인해 주세요. 안내받은 링크를 다시 열어 주세요.',
      400,
      'INVALID_GUEST_ACCESS_INPUT',
    );
}

export function isGuestId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export function isGuestVersion(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 2_147_483_647
  );
}

export function isGuestText(value: unknown, maximum: number): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value === value.trim() &&
    [...value].length <= maximum
  );
}

export function isGuestTimestamp(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
  )
    return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}

export function invalidGuestEntryResponse(): ApiRequestError {
  return new ApiRequestError(
    '이용 안내 응답을 확인할 수 없습니다. 잠시 후 다시 불러와 주세요.',
    200,
    'INVALID_GUEST_ENTRY_RESPONSE',
  );
}

export function readGuestObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw invalidGuestEntryResponse();
  return value as Record<string, unknown>;
}
