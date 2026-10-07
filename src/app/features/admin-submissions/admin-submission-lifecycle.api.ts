import { apiRequest } from '../../core/api/api-client';
import type { AdminSubmissionDetail } from './admin-submissions.types';
import type {
  AdminSubmissionLifecycleAction,
  AdminSubmissionLifecycleInput,
  AdminSubmissionLifecycleReceipt,
} from './admin-submission-lifecycle.types';
import { prepareAdminSubmissionLifecycle } from './admin-submission-lifecycle.validation';
import { readAdminSubmissionLifecycleReceipt } from './admin-submission-lifecycle.readers';
import { requireSubmissionId } from './admin-submissions-validation';

export async function changeAdminSubmissionLifecycle(
  detail: AdminSubmissionDetail,
  action: AdminSubmissionLifecycleAction,
  input: AdminSubmissionLifecycleInput,
  token: string,
  signal?: AbortSignal,
): Promise<AdminSubmissionLifecycleReceipt> {
  const body = prepareAdminSubmissionLifecycle(detail, action, input);
  const id = requireSubmissionId(detail.id);
  const response = await apiRequest<unknown>(
    `/admin/submissions/${id}/${action}`,
    {
      method: 'POST',
      token,
      signal,
      body: { expectedRevision: body.expectedRevision, reason: body.reason },
    },
  );
  return readAdminSubmissionLifecycleReceipt(response, detail, action, body);
}
