import { ApiRequestError } from '../../core/api/api-error';
import type { AdminSubmissionDetail } from './admin-submissions.types';
import type {
  AdminSubmissionLifecycleAction,
  AdminSubmissionLifecycleInput,
} from './admin-submission-lifecycle.types';

export const ADMIN_LIFECYCLE_REASON_LIMIT = 1000;

function invalid(field: string, message: string): never {
  throw new ApiRequestError(message, 400, 'INVALID_SUBMISSION_LIFECYCLE', [
    { field, messages: [message] },
  ]);
}

export function prepareAdminSubmissionLifecycle(
  detail: AdminSubmissionDetail,
  action: AdminSubmissionLifecycleAction,
  input: AdminSubmissionLifecycleInput,
): AdminSubmissionLifecycleInput {
  if (action !== 'cancel' && action !== 'restore')
    return invalid('action', '제출 기록 처리 방법을 확인해 주세요.');
  if (
    input === null ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    Object.keys(input).some(
      (key) => key !== 'expectedRevision' && key !== 'reason',
    )
  )
    return invalid('input', '제출 기록 처리 내용을 확인해 주세요.');
  if (
    detail.status !== (action === 'cancel' ? 'SUBMITTED' : 'CANCELLED') ||
    !Number.isInteger(input.expectedRevision) ||
    input.expectedRevision < 1 ||
    input.expectedRevision > 2_147_483_646 ||
    input.expectedRevision !== detail.currentRevision
  )
    return invalid(
      'expectedRevision',
      '최신 제출 기록을 확인한 뒤 진행해 주세요.',
    );
  if (typeof input.reason !== 'string')
    return invalid('reason', '처리 사유를 입력해 주세요.');
  const reason = input.reason.trim();
  if (!reason || [...reason].length > ADMIN_LIFECYCLE_REASON_LIMIT)
    return invalid(
      'reason',
      '처리 사유를 1자 이상 1000자 이하로 입력해 주세요.',
    );
  return Object.freeze({ expectedRevision: input.expectedRevision, reason });
}
