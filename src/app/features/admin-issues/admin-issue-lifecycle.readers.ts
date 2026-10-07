import type { AdminIssueRecordDto } from './admin-issues.types';
import type {
  AdminIssueLifecycleReceipt,
  ChangeAdminIssueLifecycleInput,
  IssueLifecycleAction,
} from './admin-issue-lifecycle.types';
import {
  invalidIssueResponse,
  issueStatuses,
  readIssueEnum,
  readIssueId,
  readIssueInteger,
  readIssueObject,
  readIssueTimestamp,
  readNullableIssueText,
  readNullableIssueTimestamp,
} from './admin-issues-validation';

export function readIssueLifecycleReceipt(
  value: unknown,
  issue: AdminIssueRecordDto,
  action: IssueLifecycleAction,
  input: ChangeAdminIssueLifecycleInput,
): AdminIssueLifecycleReceipt {
  const data = readIssueObject(value);
  const id = readIssueId(data.id);
  const eventId = readIssueId(data.eventId);
  const version = readIssueInteger(data.version, 2, 2_147_483_647);
  const status = readIssueEnum(data.status, issueStatuses);
  const updatedAt = readIssueTimestamp(data.updatedAt);
  const cancelledAt = readNullableIssueTimestamp(data.cancelledAt);
  const cancellationReason = readNullableIssueText(
    data.cancellationReason,
    1000,
  );
  if (
    typeof data.id !== 'string' ||
    data.id.length !== 36 ||
    typeof data.eventId !== 'string' ||
    data.eventId.length !== 36 ||
    id !== issue.id ||
    version !== input.expectedVersion + 1 ||
    status !== issue.status ||
    Date.parse(updatedAt) <= Date.parse(issue.updatedAt) ||
    (action === 'cancel'
      ? cancelledAt !== updatedAt || cancellationReason !== input.reason
      : cancelledAt !== null || cancellationReason !== null)
  )
    throw invalidIssueResponse();
  return {
    id,
    eventId,
    version,
    status,
    updatedAt,
    cancelledAt,
    cancellationReason,
  };
}
