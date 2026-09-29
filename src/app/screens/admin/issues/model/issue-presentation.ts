import { ApiRequestError } from '../../../../core/api/api-error';
import type {
  AdminIssueDetailDto,
  AdminIssueEventDto,
  AdminIssueHistoryDto,
  AdminIssueRecordDto,
  IssueEventType,
  IssueStatus,
} from '../../../../features/admin-issues/admin-issues.types';

export function issueStatusLabel(status: IssueStatus): string {
  return { NEW: '신규 접수', IN_PROGRESS: '조치 중', RESOLVED: '해결됨' }[
    status
  ];
}

export function issueStatusTone(
  status: IssueStatus,
): 'blue' | 'amber' | 'green' {
  return { NEW: 'blue', IN_PROGRESS: 'amber', RESOLVED: 'green' }[status] as
    'blue' | 'amber' | 'green';
}

export function issueTime(value: string | null): string {
  if (value === null) return '기록 없음';
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(value));
}

export function issueEventLabel(type: IssueEventType): string {
  return {
    REPORTED: '최초 신고',
    UPDATED: '메모 추가',
    STATUS_CHANGED: '처리 상태 변경',
    REPAIR_REPORTED: '직원 조치 보고',
    RESOLVED: '해결 처리',
    REOPENED: '다시 조치 중',
    CANCELLED: '신고 취소',
    RESTORED: '신고 복원',
  }[type];
}

export function issueActorRoleLabel(
  role: AdminIssueEventDto['actor']['role'],
): string {
  return { ADMIN: '관리자', STAFF: '직원', GUEST: '이용객' }[role];
}

export function issueActorSourceLabel(
  source: AdminIssueEventDto['actorSource'],
): string {
  return {
    ADMIN_SESSION: '관리자',
    GUEST_QR: '이용객 QR',
    STAFF_QR: '직원 QR',
    PRIVATE_LINK: '전용 링크',
    SYSTEM: '시스템',
  }[source];
}

export function issueChecklistLabel(
  type: NonNullable<AdminIssueRecordDto['source']>['checklistType'],
): string {
  return {
    CHECK_IN: '입실 체크',
    CHECK_OUT: '퇴실 체크',
    MAINTENANCE: '청소·정비 체크',
  }[type];
}

export function issueEventTransition(
  event: AdminIssueEventDto,
): string | undefined {
  if (
    event.fromStatus !== null &&
    event.toStatus !== null &&
    event.fromStatus !== event.toStatus
  )
    return `${issueStatusLabel(event.fromStatus)} → ${issueStatusLabel(event.toStatus)}`;
  return undefined;
}

export function verifyIssueHistory(
  data: AdminIssueHistoryDto,
  detail: AdminIssueDetailDto,
  page: number,
): void {
  const current = detail.issue;
  if (
    data.total !== current.currentVersion ||
    data.page !== page ||
    data.items.length === 0 ||
    data.items.some(
      (event, index) =>
        event.issueId !== current.id ||
        event.version !==
          current.currentVersion - (page - 1) * data.limit - index ||
        event.record.id !== current.id ||
        event.record.property.id !== current.property.id ||
        event.record.sourceSubmissionId !== current.sourceSubmissionId ||
        event.record.sourceItemId !== current.sourceItemId ||
        event.record.sourceRevisionId !== current.sourceRevisionId ||
        (event.version === current.currentVersion &&
          event.id !== detail.latestEvent.id) ||
        (event.version === 1 && event.id !== detail.report.id),
    )
  ) {
    throw new ApiRequestError(
      '이상사항이 변경되었거나 이력과 일치하지 않습니다. 최신 내용을 다시 불러와 주세요.',
      200,
      'ISSUE_HISTORY_CHANGED',
    );
  }
}
