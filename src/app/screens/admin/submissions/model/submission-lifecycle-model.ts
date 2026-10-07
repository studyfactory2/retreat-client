import type { AdminSubmissionLifecycleAction } from '../../../../features/admin-submissions/admin-submission-lifecycle.types';

export function submissionLifecyclePresentation(
  action: AdminSubmissionLifecycleAction,
) {
  const cancelling = action === 'cancel';
  return {
    title: cancelling ? '제출 취소' : '제출 복원',
    reasonLabel: cancelling ? '취소 사유' : '복원 사유',
    reviewLabel: cancelling ? '취소 내용 확인' : '복원 내용 확인',
    confirmLabel: cancelling ? '취소 확정' : '복원 확정',
    transition: cancelling ? '제출됨 → 취소됨' : '취소됨 → 제출됨',
    introduction: cancelling
      ? '제출 기록을 취소 상태로 바꾸고 관리자와 사유를 이력에 남깁니다.'
      : '취소된 기록을 제출 상태로 되돌리고 관리자와 사유를 이력에 남깁니다.',
    operationalEffect: cancelling
      ? '유효한 제출 집계와 내보내기에서 제외되며, 일정의 제출 확인에도 반영됩니다.'
      : '원래 제출일과 기존 규칙에 따라 유효한 제출 집계·내보내기·일정의 제출 확인에 다시 반영됩니다.',
  };
}

export function submissionLifecycleSavedMessage(
  action: AdminSubmissionLifecycleAction,
  revision: number,
): string {
  return `${submissionLifecyclePresentation(action).title} 처리가 버전 ${revision}에 기록되었습니다. 현재 상태와 이력을 확인해 주세요.`;
}
