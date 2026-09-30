import { ApiRequestError } from '../../../../core/api/api-error';
import type {
  AdminStayLinkStatus,
  StayLinkAction,
} from '../../../../features/admin-stay-links/admin-stay-link.types';
import {
  isStayLinkRevision,
  isStayLinkId,
  isStayLinkTimestamp,
  isStayLinkVersion,
  STAY_LINK_GRACE_MS,
  STAY_LINK_MAX_VERSION,
} from '../../../../features/admin-stay-links/admin-stay-link-validation';
import type { AdminStayDto } from '../../../../features/admin-stays/admin-stays.types';

export function getStayLinkDeadline(stay: AdminStayDto): number {
  return Date.parse(stay.checkOutAt) + STAY_LINK_GRACE_MS;
}

export function canIssueStayLink(
  stay: AdminStayDto,
  status: AdminStayLinkStatus,
  now = Date.now(),
): boolean {
  const deadline = getStayLinkDeadline(stay);
  return (
    status.stayId === stay.id &&
    isStayLinkId(stay.id) &&
    stay.property.id === stay.propertyId &&
    isStayLinkId(stay.propertyId) &&
    status.stayRevision === stay.currentRevision &&
    isStayLinkRevision(status.stayRevision) &&
    isStayLinkVersion(status.version) &&
    status.version < STAY_LINK_MAX_VERSION &&
    stay.status === 'ACTIVE' &&
    stay.property.isActive &&
    isStayLinkTimestamp(stay.checkOutAt) &&
    Number.isFinite(deadline) &&
    deadline > now
  );
}

export function canRevokeStayLink(status: AdminStayLinkStatus): boolean {
  return (
    status.issued &&
    isStayLinkId(status.stayId) &&
    isStayLinkRevision(status.stayRevision) &&
    isStayLinkVersion(status.version) &&
    status.version < STAY_LINK_MAX_VERSION
  );
}

export function sameStayLinkStatus(
  left: AdminStayLinkStatus,
  right: AdminStayLinkStatus,
): boolean {
  return (
    left.stayId === right.stayId &&
    left.version === right.version &&
    left.stayRevision === right.stayRevision &&
    left.issuedForRevision === right.issuedForRevision &&
    left.issued === right.issued &&
    left.enabled === right.enabled &&
    left.expiresAt === right.expiresAt &&
    left.updatedAt === right.updatedAt
  );
}

export function stayLinkStatusLabel(
  status: AdminStayLinkStatus,
  stay: AdminStayDto,
  now = Date.now(),
): string {
  if (!status.issued) return status.version === 0 ? '미발급' : '폐기됨';
  if (status.expiresAt && Date.parse(status.expiresAt) <= now) return '만료됨';
  if (stay.status === 'CANCELLED') return '접근 중지 · 취소된 일정';
  if (!stay.property.isActive) return '접근 중지 · 비활성 휴양소';
  if (status.issuedForRevision !== stay.currentRevision)
    return '접근 중지 · 일정 변경';
  return status.enabled ? '이용 가능' : '접근 중지';
}

const seoulDateTime = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

export function formatStayLinkTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? seoulDateTime.format(date) : '확인 필요';
}

export function stayLinkMutationFailure(
  error: unknown,
  action: StayLinkAction,
): { blocked: boolean; message: string } {
  const uncertain =
    !(error instanceof ApiRequestError) ||
    error.status === null ||
    error.status >= 500 ||
    (error.status >= 200 && error.status < 300);
  if (uncertain)
    return {
      blocked: true,
      message:
        action === 'issue'
          ? '발급 결과를 확인하지 못했습니다. 서버에서는 이미 발급되었을 수 있습니다. 최신 상태를 확인해 주세요. 받지 못한 주소는 복구할 수 없으며 다시 발급하면 이전 링크가 무효화됩니다. 자동으로 재시도하지 않습니다.'
          : '폐기 결과를 확인하지 못했습니다. 서버에서는 이미 폐기되었을 수 있습니다. 최신 상태를 확인해 주세요. 자동으로 재시도하지 않습니다.',
    };
  if (error.status === 404 || error.status === 409)
    return {
      blocked: true,
      message:
        '이용 일정 또는 개인 이용 링크 상태가 변경되었습니다. 최신 상태를 다시 확인한 뒤 진행해 주세요.',
    };
  return {
    blocked: false,
    message:
      error.status === 429
        ? '요청이 많습니다. 잠시 기다린 뒤 다시 시도해 주세요.'
        : '개인 이용 링크 요청을 처리하지 못했습니다. 상태를 확인한 뒤 다시 시도해 주세요.',
  };
}
