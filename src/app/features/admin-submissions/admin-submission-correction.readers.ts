import type { AdminSubmissionDetail } from './admin-submissions.types';
import type {
  AdminSubmissionCorrectionInput,
  AdminSubmissionCorrectionReceipt,
} from './admin-submission-correction.types';
import { adminSubmissionCorrectionEffect } from './admin-submission-correction.validation';
import {
  invalidSubmissionResponse,
  readBoolean,
  readId,
  readInteger,
  readObject,
  readTimestamp,
} from './admin-submissions-validation';

export function readAdminSubmissionCorrectionReceipt(
  value: unknown,
  detail: AdminSubmissionDetail,
  input: AdminSubmissionCorrectionInput,
): AdminSubmissionCorrectionReceipt {
  const data = readObject(value);
  const id = readId(data.id);
  const changed = readBoolean(data.changed);
  const revision = readInteger(data.revision, 1, 2_147_483_647);
  const updatedAt = readTimestamp(data.updatedAt);
  const effect = adminSubmissionCorrectionEffect(detail, input);
  if (
    id !== detail.id ||
    data.status !== 'SUBMITTED' ||
    changed !== effect.changed ||
    revision !== input.expectedRevision + (changed ? 1 : 0) ||
    (changed
      ? Date.parse(updatedAt) <= Date.parse(detail.revision.record.updatedAt)
      : updatedAt !== detail.revision.record.updatedAt)
  )
    throw invalidSubmissionResponse();
  return { id, status: 'SUBMITTED', revision, updatedAt, changed };
}
