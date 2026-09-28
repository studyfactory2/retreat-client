import { ApiRequestError } from '../../../core/api/api-error';
import type {
  AdminSubmissionActorSource,
  AdminSubmissionHistoryDto,
  AdminSubmissionPhoto,
  AdminSubmissionRecord,
  AdminSubmissionRevision,
  AdminSubmissionType,
} from '../../../features/admin-submissions/admin-submissions.types';

export function submissionTypeLabel(type: AdminSubmissionType): string {
  return {
    CHECK_IN: '입실 체크',
    CHECK_OUT: '퇴실 체크',
    MAINTENANCE: '청소·정비 체크',
  }[type];
}

export function submissionSourceLabel(
  source: AdminSubmissionActorSource,
): string {
  return {
    ADMIN_SESSION: '관리자',
    GUEST_QR: '이용객 QR',
    STAFF_QR: '직원 QR',
    PRIVATE_LINK: '전용 링크',
    SYSTEM: '시스템',
  }[source];
}

export function submissionActionLabel(
  action: AdminSubmissionRevision['action'],
): string {
  return {
    SUBMITTED: '최초 제출',
    CORRECTED: '내용 수정',
    CANCELLED: '제출 취소',
    RESTORED: '제출 복원',
  }[action];
}

export function submissionRoleLabel(role: 'ADMIN' | 'GUEST' | 'STAFF'): string {
  return { ADMIN: '관리자', GUEST: '이용객', STAFF: '직원' }[role];
}

export function submissionTime(value: string | null): string {
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

export function submissionPhotoPurpose(
  purpose: AdminSubmissionPhoto['purpose'],
): string {
  return {
    DEFECT: '이상 사진',
    MAINTENANCE_BEFORE: '정비 전',
    MAINTENANCE_AFTER: '정비 후',
    REPAIR: '조치 사진',
  }[purpose];
}

export function submissionPhotoLocation(
  photo: AdminSubmissionPhoto,
  record: AdminSubmissionRecord,
): string {
  const section = record.template.definition.sections.find(
    (candidate) => candidate.id === photo.sectionId,
  );
  const item = section?.items.find(
    (candidate) => candidate.id === photo.itemId,
  );
  return (
    [section?.title, item?.label, photo.areaLabel]
      .filter(Boolean)
      .join(' · ') || '위치 기록 없음'
  );
}

export function verifySubmissionHistory(
  data: AdminSubmissionHistoryDto,
  submissionId: string,
  currentRevision: number,
  page: number,
): void {
  if (
    data.total !== currentRevision ||
    data.page !== page ||
    data.items.length === 0 ||
    data.items.some(
      (revision, index) =>
        revision.submissionId !== submissionId ||
        revision.version !== currentRevision - (page - 1) * data.limit - index,
    )
  ) {
    throw new ApiRequestError(
      '제출 기록이 변경되었거나 이력과 일치하지 않습니다. 최신 제출 내용을 다시 불러와 주세요.',
      200,
      'SUBMISSION_HISTORY_CHANGED',
    );
  }
}
