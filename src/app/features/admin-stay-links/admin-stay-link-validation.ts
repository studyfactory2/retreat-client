import { ApiRequestError } from '../../core/api/api-error';
import { isStayId } from '../admin-stays/admin-stays-validation';
import type { AdminStayLinkStatus } from './admin-stay-link.types';

export const STAY_LINK_MAX_VERSION = 2_147_483_647;
export const STAY_LINK_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

export function isStayLinkId(value: unknown): value is string {
  return isStayId(value);
}

export function requireStayLinkId(value: unknown): string {
  if (!isStayLinkId(value))
    throw new ApiRequestError(
      '이용 일정 정보를 확인해 주세요.',
      400,
      'INVALID_STAY_ID',
    );
  return value.toLowerCase();
}

export function isStayLinkTimestamp(value: unknown): value is string {
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

export function isStayLinkVersion(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= STAY_LINK_MAX_VERSION
  );
}

export function isStayLinkRevision(value: unknown): value is number {
  return isStayLinkVersion(value) && value >= 1;
}

export function requireStayLinkChangeInput(
  previous: AdminStayLinkStatus,
  expectedId: string,
): void {
  if (
    !isStayLinkId(previous.stayId) ||
    previous.stayId.toLowerCase() !== expectedId ||
    !isStayLinkRevision(previous.stayRevision) ||
    !isStayLinkVersion(previous.version) ||
    previous.version === STAY_LINK_MAX_VERSION
  )
    throw new ApiRequestError(
      '최신 이용 일정과 개인 이용 링크 상태를 확인해 주세요.',
      400,
      'INVALID_STAY_LINK_INPUT',
    );
}

export function requireStayLinkCheckOutAt(value: unknown): asserts value is string {
  if (!isStayLinkTimestamp(value))
    throw new ApiRequestError(
      '이용 일정의 퇴실 일시를 확인해 주세요.',
      400,
      'INVALID_STAY_LINK_INPUT',
    );
}

export function invalidStayLinkResponse(): ApiRequestError {
  // A malformed success may follow a committed issue/revoke. Treat this as an
  // uncertain write requiring a fresh read, never permission to repeat the POST.
  return new ApiRequestError(
    '개인 이용 링크 응답을 확인할 수 없습니다. 최신 상태를 다시 불러와 주세요.',
    200,
    'INVALID_STAY_LINK_RESPONSE',
  );
}
