import type {
  AdminIssueRecordDto,
  AdminIssueSummaryDto,
} from './admin-issues.types';
import {
  invalidIssueResponse,
  issueStatuses,
  readIssueEnum,
  readIssueId,
  readIssueInteger,
  readIssueObject,
  readIssueText,
  readIssueTimestamp,
  readNullableIssueId,
  readNullableIssueText,
  readNullableIssueTimestamp,
} from './admin-issues-validation';

export function readIssueSummary(value: unknown): AdminIssueSummaryDto {
  const data = readIssueObject(value);
  const property = readIssueObject(data.property);
  const category = readIssueObject(data.category);
  const status = readIssueEnum(data.status, issueStatuses);
  const resolvedAt = readNullableIssueTimestamp(data.resolvedAt);
  if (
    typeof data.isUrgent !== 'boolean' ||
    (status === 'RESOLVED') !== (resolvedAt !== null)
  )
    throw invalidIssueResponse();
  return {
    id: readIssueId(data.id),
    property: {
      id: readIssueId(property.id),
      name: readIssueText(property.name, 100, true),
      region: readNullableIssueText(property.region, 100),
    },
    category: {
      id: readIssueId(category.id),
      name: readIssueText(category.name, 100, true),
    },
    title: readIssueText(data.title, 300, true),
    areaLabel: readNullableIssueText(data.areaLabel, 150),
    isUrgent: data.isUrgent,
    status,
    currentVersion: readIssueInteger(data.currentVersion, 1, 2_147_483_647),
    reportedAt: readIssueTimestamp(data.reportedAt),
    resolvedAt,
    updatedAt: readIssueTimestamp(data.updatedAt),
  };
}

export function readIssueRecord(value: unknown): AdminIssueRecordDto {
  const data = readIssueObject(value);
  const summary = readIssueSummary(data);
  const sourceSubmissionId = readNullableIssueId(data.sourceSubmissionId);
  const sourceItemId = readNullableIssueId(data.sourceItemId);
  const sourceRevisionId = readNullableIssueId(data.sourceRevisionId);
  const sourceCount = [
    sourceSubmissionId,
    sourceItemId,
    sourceRevisionId,
  ].filter((id) => id !== null).length;
  const resolvedByUserId = readNullableIssueId(data.resolvedByUserId);
  const cancelledAt = readNullableIssueTimestamp(data.cancelledAt);
  const cancellationReason = readNullableIssueText(
    data.cancellationReason,
    2000,
  );
  const recurrenceOfIssueId = readNullableIssueId(data.recurrenceOfIssueId);
  if (
    (sourceCount !== 0 && sourceCount !== 3) ||
    (summary.status === 'RESOLVED') !== (resolvedByUserId !== null) ||
    (cancelledAt === null && cancellationReason !== null) ||
    recurrenceOfIssueId === summary.id ||
    (sourceCount === 0 && data.source !== null)
  )
    throw invalidIssueResponse();
  let source: AdminIssueRecordDto['source'] = null;
  if (sourceCount === 3) {
    const context = readIssueObject(data.source);
    source = {
      checklistType: readIssueEnum(context.checklistType, [
        'CHECK_IN',
        'CHECK_OUT',
        'MAINTENANCE',
      ]),
      templateId: readIssueId(context.templateId),
      templateTitle: readIssueText(context.templateTitle, 150, true),
      templateVersion: readIssueInteger(
        context.templateVersion,
        1,
        2_147_483_647,
      ),
      sectionId: readIssueId(context.sectionId),
    };
  }
  return {
    ...summary,
    description: readNullableIssueText(data.description, 2000),
    sourceSubmissionId,
    sourceItemId,
    sourceRevisionId,
    recurrenceOfIssueId,
    resolvedByUserId,
    cancelledAt,
    cancellationReason,
    source,
  };
}
