import { ApiRequestError } from '../../core/api/api-error';
import type { AdminSubmissionDetail } from './admin-submissions.types';
import type {
  LinkSubmissionStayInput,
  SubmissionStayCandidate,
  SubmissionStayCandidatesDto,
  SubmissionStayLinkDto,
} from './admin-submission-stays.types';
import {
  invalidSubmissionResponse,
  readBoolean,
  readEnum,
  readId,
  readInteger,
  readNullableId,
  readNullableText,
  readObject,
  readSubmissionPage,
  readText,
  readTimestamp,
  readVisitDate,
} from './admin-submissions-validation';

function readCandidate(value: unknown): SubmissionStayCandidate {
  const data = readObject(value);
  const checkInAt = readTimestamp(data.checkInAt);
  const checkOutAt = readTimestamp(data.checkOutAt);
  if (Date.parse(checkInAt) >= Date.parse(checkOutAt))
    throw invalidSubmissionResponse();
  return {
    id: readId(data.id),
    propertyId: readId(data.propertyId),
    guestName: readText(data.guestName, 100, true),
    company: readNullableText(data.company, 100),
    department: readNullableText(data.department, 100),
    phone: readNullableText(data.phone, 32),
    checkInAt,
    checkOutAt,
    currentRevision: readInteger(data.currentRevision, 1, 2_147_483_647),
    alreadyLinked: readBoolean(data.alreadyLinked),
  };
}

export function readSubmissionStayCandidates(
  value: unknown,
  detail: AdminSubmissionDetail,
  page: number,
  limit: number,
): SubmissionStayCandidatesDto {
  const data = readObject(value);
  const submissionId = readId(data.submissionId);
  if (submissionId !== detail.id) throw invalidSubmissionResponse();
  const currentRevision = readInteger(data.currentRevision, 1, 2_147_483_647);
  const currentStayId = readNullableId(data.currentStayId);
  const visitDate = readVisitDate(data.visitDate);
  const type = readEnum(data.type, ['CHECK_IN', 'CHECK_OUT']);
  const record = detail.revision.record;
  if (
    currentRevision !== detail.currentRevision ||
    currentStayId !== record.stayId ||
    visitDate !== record.visitDate ||
    type !== record.type
  )
    throw new ApiRequestError(
      '체크리스트 기록이 변경되었습니다. 최신 기록을 다시 불러온 뒤 연결할 일정을 확인해 주세요.',
      409,
      'SUBMISSION_STAY_CONTEXT_CHANGED',
    );
  const result = readSubmissionPage(value, page, limit, readCandidate);
  const visitStart = Date.parse(`${visitDate}T00:00:00.000+09:00`);
  const visitEnd = visitStart + 86_400_000;
  if (
    new Set(result.items.map((item) => item.id)).size !== result.items.length ||
    result.items.some((item, index, items) => {
      const previous = items[index - 1];
      const matchingAt = Date.parse(
        type === 'CHECK_IN' ? item.checkInAt : item.checkOutAt,
      );
      return (
        item.propertyId !== record.property.id ||
        matchingAt < visitStart ||
        matchingAt >= visitEnd ||
        (previous !== undefined &&
          (Date.parse(previous.checkInAt) > Date.parse(item.checkInAt) ||
            (previous.checkInAt === item.checkInAt && previous.id >= item.id)))
      );
    })
  )
    throw invalidSubmissionResponse();
  return {
    submissionId,
    currentRevision,
    currentStayId,
    visitDate,
    type,
    ...result,
  };
}

export function readSubmissionStayLink(
  value: unknown,
  submissionId: string,
  input: LinkSubmissionStayInput,
): SubmissionStayLinkDto {
  const data = readObject(value);
  const id = readId(data.id);
  const stayId = readNullableId(data.stayId);
  const changed = readBoolean(data.changed);
  const revision = readInteger(data.revision, 1, 2_147_483_647);
  if (
    id !== submissionId ||
    stayId !== input.stayId ||
    revision !== input.expectedRevision + (changed ? 1 : 0)
  )
    throw invalidSubmissionResponse();
  return {
    id,
    stayId,
    revision,
    changed,
    updatedAt: readTimestamp(data.updatedAt),
  };
}
