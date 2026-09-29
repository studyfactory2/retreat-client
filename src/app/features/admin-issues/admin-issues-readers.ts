import type {
  AdminIssueDetailDto,
  AdminIssueEventDto,
  AdminIssuePhotoDto,
  AdminIssuePhotoViewDto,
  AdminIssueRecordDto,
} from './admin-issues.types';
import { readIssueRecord } from './admin-issue-record-readers';
import {
  invalidIssueResponse,
  issueActorSources,
  issueEventTypes,
  issueStatuses,
  readIssueEnum,
  readIssueId,
  readIssueInteger,
  readIssueObject,
  readIssueText,
  readIssueTimestamp,
  readNullableIssueId,
  readNullableIssueText,
} from './admin-issues-validation';

function readPhotos(value: unknown): AdminIssuePhotoDto[] {
  if (!Array.isArray(value)) throw invalidIssueResponse();
  const ids = new Set<string>();
  let previousOrder = -1;
  return value.map((value) => {
    const data = readIssueObject(value);
    const photo: AdminIssuePhotoDto = {
      id: readIssueId(data.id),
      status: readIssueEnum(data.status, ['READY']),
      filename: readIssueText(data.filename),
      contentType: readIssueEnum(data.contentType, ['image/jpeg']),
      sizeBytes: readIssueInteger(data.sizeBytes, 1),
      width: readIssueInteger(data.width, 1),
      height: readIssueInteger(data.height, 1),
      createdAt: readIssueTimestamp(data.createdAt),
      sortOrder: readIssueInteger(data.sortOrder),
    };
    // Source submission photo positions may have gaps; retain the saved order.
    if (ids.has(photo.id) || photo.sortOrder <= previousOrder)
      throw invalidIssueResponse();
    ids.add(photo.id);
    previousOrder = photo.sortOrder;
    return photo;
  });
}

export function readIssueEvent(
  value: unknown,
  issueId: string,
): AdminIssueEventDto {
  const data = readIssueObject(value);
  const record = readIssueRecord(data.record);
  const actor = readIssueObject(data.actor);
  const actorId = readNullableIssueId(actor.id);
  const role = readIssueEnum(actor.role, ['ADMIN', 'STAFF', 'GUEST']);
  const version = readIssueInteger(data.version, 1, 2_147_483_647);
  const type = readIssueEnum(data.type, issueEventTypes);
  const fromStatus =
    data.fromStatus === null
      ? null
      : readIssueEnum(data.fromStatus, issueStatuses);
  const toStatus =
    data.toStatus === null ? null : readIssueEnum(data.toStatus, issueStatuses);
  const sourceRevisionId = readNullableIssueId(data.sourceRevisionId);
  const createdAt = readIssueTimestamp(data.createdAt);
  if (
    readIssueId(data.issueId) !== issueId ||
    record.id !== issueId ||
    record.currentVersion !== version ||
    (actorId === null && role !== 'GUEST') ||
    toStatus !== record.status ||
    createdAt !== record.updatedAt ||
    (version === 1 && (type !== 'REPORTED' || fromStatus !== null)) ||
    (record.sourceSubmissionId === null && sourceRevisionId !== null) ||
    (record.sourceSubmissionId !== null &&
      (type === 'REPORTED' || type === 'REPAIR_REPORTED') &&
      (sourceRevisionId === null ||
        (type === 'REPORTED' && sourceRevisionId !== record.sourceRevisionId)))
  )
    throw invalidIssueResponse();
  const photos = readPhotos(data.photos);
  if (
    record.sourceSubmissionId !== null &&
    photos.length > 0 &&
    (sourceRevisionId === null ||
      (type !== 'REPORTED' && type !== 'REPAIR_REPORTED'))
  )
    throw invalidIssueResponse();
  return {
    id: readIssueId(data.id),
    issueId,
    version,
    type,
    actorSource: readIssueEnum(data.actorSource, issueActorSources),
    actor: { id: actorId, role, name: readIssueText(actor.name, 100, true) },
    sourceRevisionId,
    note: readNullableIssueText(data.note, 2000),
    fromStatus,
    toStatus,
    createdAt,
    record,
    photos,
  };
}

export function sameIssueSource(
  a: AdminIssueRecordDto,
  b: AdminIssueRecordDto,
): boolean {
  return (
    a.id === b.id &&
    a.property.id === b.property.id &&
    a.sourceSubmissionId === b.sourceSubmissionId &&
    a.sourceItemId === b.sourceItemId &&
    a.sourceRevisionId === b.sourceRevisionId
  );
}

export function readIssueDetail(
  value: unknown,
  issueId: string,
): AdminIssueDetailDto {
  const data = readIssueObject(value);
  const issue = readIssueRecord(data.issue);
  const report = readIssueEvent(data.report, issueId);
  const latestEvent = readIssueEvent(data.latestEvent, issueId);
  if (
    issue.id !== issueId ||
    report.version !== 1 ||
    report.type !== 'REPORTED' ||
    latestEvent.version !== issue.currentVersion ||
    !sameIssueSource(issue, report.record) ||
    !sameIssueSource(issue, latestEvent.record) ||
    JSON.stringify(issue) !== JSON.stringify(latestEvent.record) ||
    (issue.currentVersion === 1
      ? JSON.stringify(report) !== JSON.stringify(latestEvent)
      : report.id === latestEvent.id)
  )
    throw invalidIssueResponse();
  return { issue, report, latestEvent };
}

export function readIssuePhotoView(
  value: unknown,
  allowLoopbackHttp = import.meta.env.DEV,
): AdminIssuePhotoViewDto {
  const data = readIssueObject(value);
  const url = readIssueText(data.url, Number.MAX_SAFE_INTEGER, true);
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw invalidIssueResponse();
  }
  const localHttp =
    allowLoopbackHttp &&
    parsed.protocol === 'http:' &&
    ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  if (
    (parsed.protocol !== 'https:' && !localHttp) ||
    parsed.username ||
    parsed.password ||
    [...url].some(
      (character) =>
        character.charCodeAt(0) <= 0x20 || character.charCodeAt(0) === 0x7f,
    )
  )
    throw invalidIssueResponse();
  return { url, expiresAt: readIssueTimestamp(data.expiresAt) };
}
