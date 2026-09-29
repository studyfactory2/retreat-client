import type { AdminSubmissionDetail } from '../../../../features/admin-submissions/admin-submissions.types';

export function canReviewSubmissionStay(
  detail: AdminSubmissionDetail,
): boolean {
  const record = detail.revision.record;
  // The API additionally checks private-link context that is not exposed in this DTO.
  return (
    detail.status === 'SUBMITTED' &&
    detail.currentRevision <= 2_147_483_646 &&
    record.authorSource === 'GUEST_QR' &&
    (record.type === 'CHECK_IN' || record.type === 'CHECK_OUT')
  );
}

export function submissionStayRestriction(
  detail: AdminSubmissionDetail,
): string {
  if (detail.status === 'CANCELLED')
    return '취소된 제출 기록은 이용 일정 연결을 변경할 수 없습니다.';
  if (detail.revision.record.type === 'MAINTENANCE')
    return '정비 기록은 이 화면에서 이용 일정에 연결하지 않습니다.';
  if (detail.currentRevision > 2_147_483_646)
    return '이 기록은 변경 가능한 버전 한도에 도달하여 일정 연결을 변경할 수 없습니다.';
  return '이용객 전용 링크 등으로 작성된 기록은 이 화면에서 이용 일정 연결을 변경할 수 없습니다.';
}
