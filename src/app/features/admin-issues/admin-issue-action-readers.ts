import type {
  AddAdminIssueNoteInput,
  AdminIssueDetailDto,
  ChangeAdminIssueStatusInput,
} from './admin-issues.types';
import { readIssueDetail } from './admin-issues-readers';
import { invalidIssueResponse } from './admin-issues-validation';

function readActionDetail(
  value: unknown,
  issueId: string,
  expectedVersion: number,
): AdminIssueDetailDto {
  const detail = readIssueDetail(value, issueId);
  const { issue, latestEvent, report } = detail;
  if (
    issue.currentVersion !== expectedVersion + 1 ||
    latestEvent.actorSource !== 'ADMIN_SESSION' ||
    latestEvent.actor.role !== 'ADMIN' ||
    latestEvent.actor.id === null ||
    latestEvent.fromStatus === null ||
    latestEvent.sourceRevisionId !== null ||
    latestEvent.photos.length !== 0 ||
    issue.cancelledAt !== null ||
    issue.cancellationReason !== null ||
    Date.parse(latestEvent.createdAt) <= Date.parse(report.createdAt)
  )
    throw invalidIssueResponse();
  return detail;
}

export function readIssueNoteResult(
  value: unknown,
  issueId: string,
  input: AddAdminIssueNoteInput,
): AdminIssueDetailDto {
  const detail = readActionDetail(value, issueId, input.expectedVersion);
  const { issue, latestEvent } = detail;
  if (
    latestEvent.type !== 'UPDATED' ||
    latestEvent.note !== input.note ||
    latestEvent.fromStatus !== issue.status ||
    latestEvent.toStatus !== issue.status
  )
    throw invalidIssueResponse();
  return detail;
}

export function readIssueStatusResult(
  value: unknown,
  issueId: string,
  input: ChangeAdminIssueStatusInput,
): AdminIssueDetailDto {
  const detail = readActionDetail(value, issueId, input.expectedVersion);
  const { issue, latestEvent } = detail;
  if (
    issue.status !== input.status ||
    latestEvent.note !== (input.note ?? null)
  )
    throw invalidIssueResponse();
  if (input.status === 'RESOLVED') {
    if (
      !input.note ||
      (latestEvent.fromStatus !== 'NEW' &&
        latestEvent.fromStatus !== 'IN_PROGRESS') ||
      latestEvent.type !== 'RESOLVED' ||
      issue.resolvedAt !== latestEvent.createdAt ||
      issue.resolvedByUserId !== latestEvent.actor.id
    )
      throw invalidIssueResponse();
  } else {
    const reopening = latestEvent.fromStatus === 'RESOLVED';
    if (
      (latestEvent.fromStatus !== 'NEW' && !reopening) ||
      latestEvent.type !== (reopening ? 'REOPENED' : 'STATUS_CHANGED') ||
      (reopening && !input.note) ||
      issue.resolvedAt !== null ||
      issue.resolvedByUserId !== null
    )
      throw invalidIssueResponse();
  }
  return detail;
}

export function verifyIssueActionReceipt(
  before: AdminIssueDetailDto,
  after: AdminIssueDetailDto,
  adminId: string,
  kind: 'note' | 'status',
): void {
  const original = before.issue;
  const current = after.issue;
  const event = after.latestEvent;
  const unchangedFields = [
    'id',
    'title',
    'description',
    'areaLabel',
    'isUrgent',
    'sourceSubmissionId',
    'sourceItemId',
    'sourceRevisionId',
    'recurrenceOfIssueId',
    'reportedAt',
  ] as const;
  if (
    original.cancelledAt !== null ||
    current.currentVersion !== original.currentVersion + 1 ||
    event.fromStatus !== original.status ||
    event.actor.id !== adminId.toLowerCase() ||
    event.actor.role !== 'ADMIN' ||
    event.actorSource !== 'ADMIN_SESSION' ||
    current.property.id !== original.property.id ||
    current.category.id !== original.category.id ||
    unchangedFields.some((field) => current[field] !== original[field]) ||
    JSON.stringify(current.source) !== JSON.stringify(original.source) ||
    JSON.stringify(after.report) !== JSON.stringify(before.report) ||
    Date.parse(current.updatedAt) <= Date.parse(original.updatedAt) ||
    (kind === 'note' &&
      (current.status !== original.status ||
        current.resolvedAt !== original.resolvedAt ||
        current.resolvedByUserId !== original.resolvedByUserId)) ||
    (kind === 'status' && current.status === original.status)
  )
    throw invalidIssueResponse();
}
