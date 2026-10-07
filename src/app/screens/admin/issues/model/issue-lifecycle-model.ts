import type { IssueLifecycleAction } from '../../../../features/admin-issues/admin-issue-lifecycle.types';

export function issueLifecyclePresentation(action: IssueLifecycleAction) {
  return action === 'cancel'
    ? {
        title: '신고 취소',
        reasonLabel: '취소 사유',
        reviewLabel: '취소 내용 확인',
        confirmLabel: '취소 확정',
        introduction:
          '잘못 접수되었거나 중복된 신고를 취소합니다. 문제가 해결되었다는 뜻은 아닙니다.',
        consequence:
          '운영 중인 이상사항 집계와 운영 보고서에서 제외됩니다. 처리 상태와 사진·이력은 유지됩니다.',
      }
    : {
        title: '신고 복원',
        reasonLabel: '복원 사유',
        reviewLabel: '복원 내용 확인',
        confirmLabel: '복원 확정',
        introduction:
          '잘못 취소한 신고를 다시 확인할 수 있도록 복원합니다. 현재 저장된 처리 상태는 유지됩니다.',
        consequence:
          '유지된 처리 상태와 기존 규칙에 따라 집계·운영 보고서에 다시 반영됩니다. 해결된 신고는 해결됨 상태로 복원됩니다.',
      };
}

export function issueLifecycleSavedMessage(
  action: IssueLifecycleAction,
  version: number,
): string {
  return `${issueLifecyclePresentation(action).title} 처리가 버전 ${version}에 기록되었습니다. 현재 상태와 처리 이력을 확인해 주세요.`;
}
