import type { AdminSubmissionDetail } from './admin-submissions.types';
import type {
  AdminSubmissionLifecycleAction,
  AdminSubmissionLifecycleInput,
  AdminSubmissionLifecycleReceipt,
} from './admin-submission-lifecycle.types';
import {
  invalidSubmissionResponse,
  readId,
  readInteger,
  readNullableTimestamp,
  readObject,
  readTimestamp,
} from './admin-submissions-validation';

export function readAdminSubmissionLifecycleReceipt(
  value: unknown,
  detail: AdminSubmissionDetail,
  action: AdminSubmissionLifecycleAction,
  input: AdminSubmissionLifecycleInput,
): AdminSubmissionLifecycleReceipt {
  const data = readObject(value);
  const id = readId(data.id);
  const revision = readInteger(data.revision, 2, 2_147_483_647);
  const updatedAt = readTimestamp(data.updatedAt);
  const cancelledAt = readNullableTimestamp(data.cancelledAt);
  const status = action === 'cancel' ? 'CANCELLED' : 'SUBMITTED';
  if (
    typeof data.id !== 'string' ||
    data.id.length !== 36 ||
    id !== detail.id ||
    data.status !== status ||
    revision !== input.expectedRevision + 1 ||
    Date.parse(updatedAt) <= Date.parse(detail.revision.record.updatedAt) ||
    (action === 'cancel' ? cancelledAt !== updatedAt : cancelledAt !== null)
  )
    throw invalidSubmissionResponse();
  return { id, status, revision, updatedAt, cancelledAt };
}
