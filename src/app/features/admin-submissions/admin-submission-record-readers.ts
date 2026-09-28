import type {
  AdminSubmissionAnswers,
  AdminSubmissionAuthor,
  AdminSubmissionProperty,
  AdminSubmissionRecord,
  AdminSubmissionStatus,
  AdminSubmissionTemplate,
  AdminSubmissionType,
} from './admin-submission-record.types';
import {
  invalidSubmissionResponse,
  readArray,
  readBoolean,
  readEnum,
  readId,
  readInteger,
  readNullableId,
  readNullableText,
  readNullableTimestamp,
  readObject,
  readText,
  readTimestamp,
  readVisitDate,
  submissionActorSources,
  submissionTypes,
} from './admin-submissions-validation';

export function readSubmissionProperty(
  value: unknown,
): AdminSubmissionProperty {
  const data = readObject(value);
  return {
    id: readId(data.id),
    name: readText(data.name, 100, true),
    region: readNullableText(data.region, 100),
  };
}

export function readSubmissionAuthorIdentity(
  value: unknown,
  type: AdminSubmissionType,
): Pick<AdminSubmissionAuthor, 'id' | 'name' | 'role'> {
  const data = readObject(value);
  const id = readNullableId(data.id);
  const role = readEnum(data.role, ['GUEST', 'STAFF']);
  if (
    role !== (type === 'MAINTENANCE' ? 'STAFF' : 'GUEST') ||
    (role === 'STAFF' && id === null)
  )
    throw invalidSubmissionResponse();
  return { id, role, name: readText(data.name, 100, true) };
}

function readTemplate(
  value: unknown,
  type: AdminSubmissionType,
): AdminSubmissionTemplate {
  const data = readObject(value);
  const definition = readObject(data.definition);
  if (
    data.schemaVersion !== 1 ||
    data.type !== type ||
    definition.schemaVersion !== 1
  )
    throw invalidSubmissionResponse();
  const usedIds = new Set<string>();
  const claimId = (value: unknown) => {
    const id = readId(value);
    if (usedIds.has(id)) throw invalidSubmissionResponse();
    usedIds.add(id);
    return id;
  };
  const sections = readArray(definition.sections, 20, 1).map((value) => {
    const section = readObject(value);
    const id = claimId(section.id);
    return {
      id,
      title: readText(section.title, 150, true),
      items: readArray(section.items, 50, 1).map((value) => {
        const item = readObject(value);
        return {
          id: claimId(item.id),
          label: readText(item.label, 300, true),
          required: readBoolean(item.required),
          answerType: readEnum(item.answerType, ['NORMAL_ABNORMAL']),
        };
      }),
    };
  });
  if (
    sections.reduce((total, section) => total + section.items.length, 0) > 500
  )
    throw invalidSubmissionResponse();
  return {
    schemaVersion: 1,
    id: readId(data.id),
    type,
    title: readText(data.title, 150, true),
    version: readInteger(data.version, 1),
    definition: { schemaVersion: 1, sections },
  };
}

function readAnswers(
  value: unknown,
  template: AdminSubmissionTemplate,
): AdminSubmissionAnswers {
  const data = readObject(value);
  if (data.schemaVersion !== 1) throw invalidSubmissionResponse();
  const availableItems = template.definition.sections.flatMap(
    (section) => section.items,
  );
  const availableIds = new Set(availableItems.map((item) => item.id));
  const usedIds = new Set<string>();
  const items = readArray(data.items, 500).map((value) => {
    const data = readObject(value);
    const itemId = readId(data.itemId);
    if (!availableIds.has(itemId) || usedIds.has(itemId))
      throw invalidSubmissionResponse();
    usedIds.add(itemId);
    const answer = {
      itemId,
      value: readEnum(data.value, ['NORMAL', 'ABNORMAL']),
      description: readNullableText(data.description, 2000),
      isUrgent: readBoolean(data.isUrgent),
      repairReported: readBoolean(data.repairReported),
      repairNote: readNullableText(data.repairNote, 2000),
    };
    if (
      (template.type !== 'MAINTENANCE' &&
        (answer.repairReported || answer.repairNote !== null)) ||
      (answer.repairNote !== null && !answer.repairReported) ||
      (answer.value === 'NORMAL' &&
        (answer.description !== null ||
          answer.isUrgent ||
          answer.repairReported ||
          answer.repairNote !== null))
    )
      throw invalidSubmissionResponse();
    return answer;
  });
  // Optional items may remain unanswered and answers need not follow template order.
  if (availableItems.some((item) => item.required && !usedIds.has(item.id)))
    throw invalidSubmissionResponse();
  return {
    schemaVersion: 1,
    items,
    generalNote: readNullableText(data.generalNote, 4000),
  };
}

export function readSubmissionDates(
  data: Record<string, unknown>,
  type: AdminSubmissionType,
  status: AdminSubmissionStatus,
) {
  const startedAt = readNullableTimestamp(data.startedAt);
  const submittedAt = readTimestamp(data.submittedAt);
  const cancelledAt = readNullableTimestamp(data.cancelledAt);
  if (
    (type === 'MAINTENANCE' && startedAt === null) ||
    (status === 'CANCELLED' ? cancelledAt === null : cancelledAt !== null)
  )
    throw invalidSubmissionResponse();
  return { startedAt, submittedAt, cancelledAt };
}

export function readSubmissionRecord(
  value: unknown,
  status: AdminSubmissionStatus,
): AdminSubmissionRecord {
  const data = readObject(value);
  const type = readEnum(data.type, submissionTypes);
  const authorSource = readEnum(data.authorSource, submissionActorSources);
  if (
    (authorSource === 'STAFF_QR' && type !== 'MAINTENANCE') ||
    (authorSource === 'GUEST_QR' && type === 'MAINTENANCE')
  )
    throw invalidSubmissionResponse();
  const author = readObject(data.author);
  const template = readTemplate(data.template, type);
  return {
    property: readSubmissionProperty(data.property),
    type,
    visitDate: readVisitDate(data.visitDate),
    stayId: readNullableId(data.stayId),
    authorSource,
    author: {
      ...readSubmissionAuthorIdentity(author, type),
      company: readNullableText(author.company, 150),
      department: readNullableText(author.department, 150),
      phone: readNullableText(author.phone, 50),
    },
    template,
    answers: readAnswers(data.answers, template),
    ...readSubmissionDates(data, type, status),
    createdAt: readTimestamp(data.createdAt),
    updatedAt: readTimestamp(data.updatedAt),
  };
}
