import type {
  AdminSubmissionDetail,
  AdminSubmissionPhoto,
  AdminSubmissionPhotoViewDto,
  AdminSubmissionRecord,
  AdminSubmissionRevision,
  AdminSubmissionSummary,
} from './admin-submissions.types';
import {
  readSubmissionAuthorIdentity,
  readSubmissionDates,
  readSubmissionProperty,
  readSubmissionRecord,
} from './admin-submission-record-readers';
import {
  invalidSubmissionResponse,
  readArray,
  readEnum,
  readId,
  readInteger,
  readNullableId,
  readNullableText,
  readObject,
  readText,
  readTimestamp,
  readVisitDate,
  submissionActorSources,
  submissionStatuses,
  submissionTypes,
} from './admin-submissions-validation';

export function readSubmissionSummary(value: unknown): AdminSubmissionSummary {
  const data = readObject(value);
  const type = readEnum(data.type, submissionTypes);
  const status = readEnum(data.status, submissionStatuses);
  const answeredItemCount = readInteger(data.answeredItemCount, 0, 500);
  return {
    id: readId(data.id),
    stayId: readNullableId(data.stayId),
    authorSource: readEnum(data.authorSource, submissionActorSources),
    type,
    status,
    currentRevision: readInteger(data.currentRevision, 1),
    property: readSubmissionProperty(data.property),
    visitDate: readVisitDate(data.visitDate),
    author: readSubmissionAuthorIdentity(data.author, type),
    ...readSubmissionDates(data, type, status),
    answeredItemCount,
    abnormalItemCount: readInteger(
      data.abnormalItemCount,
      0,
      answeredItemCount,
    ),
    photoCount: readInteger(data.photoCount, 0, 40),
  };
}

function readPhotos(
  value: unknown,
  record: AdminSubmissionRecord,
): AdminSubmissionPhoto[] {
  const sectionIds = new Set(
    record.template.definition.sections.map((section) => section.id),
  );
  const itemSections = new Map(
    record.template.definition.sections.flatMap((section) =>
      section.items.map((item) => [item.id, section.id] as const),
    ),
  );
  const answers = new Map(
    record.answers.items.map((answer) => [answer.itemId, answer]),
  );
  const ids = new Set<string>();
  return readArray(value, 40).map((value, index) => {
    const data = readObject(value);
    const photo: AdminSubmissionPhoto = {
      id: readId(data.id),
      status: readEnum(data.status, ['READY']),
      filename: readText(data.filename),
      contentType: readEnum(data.contentType, ['image/jpeg']),
      sizeBytes: readInteger(data.sizeBytes, 1),
      width: readInteger(data.width, 1),
      height: readInteger(data.height, 1),
      createdAt: readTimestamp(data.createdAt),
      purpose: readEnum(data.purpose, [
        'DEFECT',
        'MAINTENANCE_BEFORE',
        'MAINTENANCE_AFTER',
        'REPAIR',
      ]),
      sectionId: readNullableId(data.sectionId),
      itemId: readNullableId(data.itemId),
      areaLabel: readNullableText(data.areaLabel, 150),
      sortOrder: readInteger(data.sortOrder),
    };
    const answer =
      photo.itemId === null ? undefined : answers.get(photo.itemId);
    if (
      ids.has(photo.id) ||
      photo.sortOrder !== index ||
      (photo.sectionId !== null && !sectionIds.has(photo.sectionId)) ||
      (photo.itemId !== null &&
        itemSections.get(photo.itemId) !== photo.sectionId) ||
      (record.type !== 'MAINTENANCE' && photo.purpose !== 'DEFECT') ||
      (photo.purpose === 'DEFECT' && answer?.value !== 'ABNORMAL') ||
      (photo.purpose === 'REPAIR' &&
        (answer?.value !== 'ABNORMAL' || !answer.repairReported)) ||
      ((photo.purpose === 'MAINTENANCE_BEFORE' ||
        photo.purpose === 'MAINTENANCE_AFTER') &&
        photo.sectionId === null &&
        photo.itemId === null &&
        photo.areaLabel === null)
    )
      throw invalidSubmissionResponse();
    ids.add(photo.id);
    return photo;
  });
}

export function readSubmissionRevision(
  value: unknown,
  submissionId: string,
): AdminSubmissionRevision {
  const data = readObject(value);
  const status = readEnum(data.status, submissionStatuses);
  if (readId(data.submissionId) !== submissionId)
    throw invalidSubmissionResponse();
  const actor = readObject(data.actor);
  const actorId = readNullableId(actor.id);
  const role = readEnum(actor.role, ['ADMIN', 'STAFF', 'GUEST']);
  if (actorId === null && role !== 'GUEST') throw invalidSubmissionResponse();
  const record = readSubmissionRecord(data.record, status);
  return {
    id: readId(data.id),
    submissionId,
    version: readInteger(data.version, 1),
    action: readEnum(data.action, [
      'SUBMITTED',
      'CORRECTED',
      'CANCELLED',
      'RESTORED',
    ]),
    status,
    createdAt: readTimestamp(data.createdAt),
    reason: readNullableText(data.reason),
    actorSource: readEnum(data.actorSource, submissionActorSources),
    actor: { id: actorId, role, name: readText(actor.name, 100, true) },
    record,
    photos: readPhotos(data.photos, record),
  };
}

export function readSubmissionDetail(
  value: unknown,
  id: string,
): AdminSubmissionDetail {
  const data = readObject(value);
  const status = readEnum(data.status, submissionStatuses);
  const currentRevision = readInteger(data.currentRevision, 1);
  const revision = readSubmissionRevision(data.revision, id);
  if (
    readId(data.id) !== id ||
    revision.version !== currentRevision ||
    revision.status !== status
  )
    throw invalidSubmissionResponse();
  return { id, status, currentRevision, revision };
}

export function readSubmissionPhotoView(
  value: unknown,
  allowLoopbackHttp = import.meta.env.DEV,
): AdminSubmissionPhotoViewDto {
  const data = readObject(value);
  const url = readText(data.url, Number.MAX_SAFE_INTEGER, true);
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw invalidSubmissionResponse();
  }
  const localHttp =
    allowLoopbackHttp &&
    parsed.protocol === 'http:' &&
    ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  if (
    (parsed.protocol !== 'https:' && !localHttp) ||
    parsed.username ||
    parsed.password ||
    [...url].some((character) => {
      const code = character.charCodeAt(0);
      return code <= 0x20 || code === 0x7f;
    })
  )
    throw invalidSubmissionResponse();
  return { url, expiresAt: readTimestamp(data.expiresAt) };
}
