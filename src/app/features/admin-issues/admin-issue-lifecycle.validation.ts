import { ApiRequestError } from '../../core/api/api-error';
import type { AdminIssueRecordDto } from './admin-issues.types';
import type {
  ChangeAdminIssueLifecycleInput,
  IssueLifecycleAction,
} from './admin-issue-lifecycle.types';
import { requireActionVersion } from './admin-issue-action-validation';

export const ISSUE_LIFECYCLE_REASON_LIMIT = 1000;

function invalid(field: string, message: string): never {
  throw new ApiRequestError(message, 400, 'INVALID_ISSUE_LIFECYCLE', [
    { field, messages: [message] },
  ]);
}

export function prepareIssueLifecycle(
  issue: AdminIssueRecordDto,
  action: IssueLifecycleAction,
  input: ChangeAdminIssueLifecycleInput,
): ChangeAdminIssueLifecycleInput {
  if (action !== 'cancel' && action !== 'restore')
    return invalid('action', '신고 처리 방법을 확인해 주세요.');
  if (
    input === null ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    Object.keys(input).some(
      (key) => key !== 'expectedVersion' && key !== 'reason',
    )
  )
    return invalid('input', '신고 처리 내용을 확인해 주세요.');
  requireActionVersion(input.expectedVersion);
  if (
    input.expectedVersion !== issue.currentVersion ||
    (action === 'cancel'
      ? issue.cancelledAt !== null
      : issue.cancelledAt === null)
  )
    return invalid(
      'expectedVersion',
      '최신 신고 상태를 확인한 뒤 다시 진행해 주세요.',
    );
  if (typeof input.reason !== 'string')
    return invalid('reason', '처리 사유를 입력해 주세요.');
  const reason = input.reason.trim();
  if (!reason || [...reason].length > ISSUE_LIFECYCLE_REASON_LIMIT)
    return invalid(
      'reason',
      '처리 사유를 1자 이상 1000자 이하로 입력해 주세요.',
    );
  return Object.freeze({ expectedVersion: input.expectedVersion, reason });
}
