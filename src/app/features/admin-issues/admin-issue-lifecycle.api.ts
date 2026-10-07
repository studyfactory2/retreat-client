import { apiRequest } from '../../core/api/api-client';
import type { AdminIssueRecordDto } from './admin-issues.types';
import type {
  AdminIssueLifecycleReceipt,
  ChangeAdminIssueLifecycleInput,
  IssueLifecycleAction,
} from './admin-issue-lifecycle.types';
import { prepareIssueLifecycle } from './admin-issue-lifecycle.validation';
import { readIssueLifecycleReceipt } from './admin-issue-lifecycle.readers';
import { requireIssueId } from './admin-issues-validation';

export async function changeAdminIssueLifecycle(
  issue: AdminIssueRecordDto,
  action: IssueLifecycleAction,
  input: ChangeAdminIssueLifecycleInput,
  token: string,
  signal?: AbortSignal,
): Promise<AdminIssueLifecycleReceipt> {
  const body = prepareIssueLifecycle(issue, action, input);
  const id = requireIssueId(issue.id);
  const response = await apiRequest<unknown>(`/admin/issues/${id}/${action}`, {
    method: 'POST',
    token,
    signal,
    body: { expectedVersion: body.expectedVersion, reason: body.reason },
  });
  return readIssueLifecycleReceipt(response, issue, action, body);
}
