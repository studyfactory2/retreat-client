import { apiRequest } from '../../core/api/api-client';
import type { AdminSubmissionDetail } from './admin-submissions.types';
import type {
  AdminSubmissionCorrectionInput,
  AdminSubmissionCorrectionReceipt,
} from './admin-submission-correction.types';
import { prepareAdminSubmissionCorrection } from './admin-submission-correction.validation';
import { readAdminSubmissionCorrectionReceipt } from './admin-submission-correction.readers';
import { requireSubmissionId } from './admin-submissions-validation';

export async function correctAdminSubmission(
  detail: AdminSubmissionDetail,
  input: AdminSubmissionCorrectionInput,
  token: string,
  signal?: AbortSignal,
): Promise<AdminSubmissionCorrectionReceipt> {
  const id = requireSubmissionId(detail.id);
  const body = prepareAdminSubmissionCorrection(detail, input);
  const response = await apiRequest<unknown>(
    `/admin/submissions/${id}/correct`,
    {
      method: 'POST',
      token,
      signal,
      body: {
        expectedRevision: body.expectedRevision,
        items: body.items.map((item) => ({ ...item })),
        generalNote: body.generalNote,
        reason: body.reason,
      },
    },
  );
  return readAdminSubmissionCorrectionReceipt(response, detail, body);
}
