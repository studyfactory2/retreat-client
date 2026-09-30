import { ApiRequestError } from '../../core/api/api-error';
import type { QrFlow } from './admin-property-qr.types';

export function isPropertyQrId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export function requirePropertyQrId(value: unknown): string {
  if (!isPropertyQrId(value))
    throw new ApiRequestError(
      '휴양소 정보를 확인해 주세요.',
      400,
      'INVALID_PROPERTY_ID',
    );
  return value.toLowerCase();
}

export function isQrTimestamp(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
  )
    return false;
  const timestamp = Date.parse(value);
  return (
    Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value
  );
}

export function requireQrRotationInput(
  flow: unknown,
  expectedRotatedAt: unknown,
): asserts flow is QrFlow {
  if (
    (flow !== 'GUEST' && flow !== 'STAFF') ||
    (expectedRotatedAt !== null && !isQrTimestamp(expectedRotatedAt))
  )
    throw new ApiRequestError(
      'QR 종류와 최근 발급 일시를 확인해 주세요.',
      400,
      'INVALID_QR_INPUT',
    );
}

export function invalidQrResponse(): ApiRequestError {
  // A malformed issuance receipt may follow a committed rotation. A 200 error
  // must be handled as an uncertain write, never as permission to retry it.
  return new ApiRequestError(
    'QR 응답을 확인할 수 없습니다. 최신 상태를 다시 불러와 주세요.',
    200,
    'INVALID_QR_RESPONSE',
  );
}
