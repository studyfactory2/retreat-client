import { apiRequest } from '../../core/api/api-client';
import { ApiRequestError } from '../../core/api/api-error';
import type {
  AdminSubmissionDetail,
  AdminSubmissionHistoryDto,
  AdminSubmissionListDto,
  AdminSubmissionListInput,
  AdminSubmissionPhotoViewDto,
} from './admin-submissions.types';
import {
  readSubmissionDetail,
  readSubmissionPhotoView,
  readSubmissionRevision,
  readSubmissionSummary,
} from './admin-submissions-readers';
import {
  invalidSubmissionResponse,
  isSubmissionDate,
  readSubmissionPage,
  requireSubmissionId,
  requireSubmissionPage,
  submissionStatuses,
  submissionTypes,
} from './admin-submissions-validation';

export const SUBMISSION_LIST_PAGE_SIZE = 20;
export const SUBMISSION_HISTORY_PAGE_SIZE = 5;

export async function getAdminSubmissions(
  input: AdminSubmissionListInput,
  token: string,
  signal?: AbortSignal,
): Promise<AdminSubmissionListDto> {
  requireSubmissionPage(input.page);
  if (
    (input.type !== undefined && !submissionTypes.includes(input.type)) ||
    (input.status !== undefined &&
      !submissionStatuses.includes(input.status)) ||
    (input.from !== undefined && !isSubmissionDate(input.from)) ||
    (input.to !== undefined && !isSubmissionDate(input.to)) ||
    (input.from !== undefined &&
      input.to !== undefined &&
      input.from > input.to)
  )
    throw new ApiRequestError(
      '체크리스트 검색 조건을 확인해 주세요.',
      400,
      'INVALID_SUBMISSION_FILTER',
    );
  const propertyId =
    input.propertyId === undefined
      ? undefined
      : requireSubmissionId(input.propertyId);
  const stayId =
    input.stayId === undefined ? undefined : requireSubmissionId(input.stayId);
  const query = new URLSearchParams({
    page: String(input.page),
    limit: String(SUBMISSION_LIST_PAGE_SIZE),
  });
  for (const [key, value] of Object.entries({
    propertyId,
    stayId,
    type: input.type,
    status: input.status,
    from: input.from,
    to: input.to,
  })) {
    if (value !== undefined) query.set(key, value);
  }
  const value = await apiRequest<unknown>(`/admin/submissions?${query}`, {
    token,
    signal,
  });
  const result = readSubmissionPage(
    value,
    input.page,
    SUBMISSION_LIST_PAGE_SIZE,
    readSubmissionSummary,
  );
  if (
    new Set(result.items.map((item) => item.id)).size !== result.items.length ||
    result.items.some((item, index, items) => {
      const previous = items[index - 1];
      return (
        (propertyId !== undefined && item.property.id !== propertyId) ||
        (stayId !== undefined && item.stayId !== stayId) ||
        (input.type !== undefined && item.type !== input.type) ||
        (input.status !== undefined && item.status !== input.status) ||
        (input.from !== undefined && item.visitDate < input.from) ||
        (input.to !== undefined && item.visitDate > input.to) ||
        (previous !== undefined &&
          (Date.parse(previous.submittedAt) < Date.parse(item.submittedAt) ||
            (previous.submittedAt === item.submittedAt &&
              previous.id <= item.id)))
      );
    })
  )
    throw invalidSubmissionResponse();
  return result;
}

export async function getAdminSubmission(
  id: string,
  token: string,
  signal?: AbortSignal,
): Promise<AdminSubmissionDetail> {
  const submissionId = requireSubmissionId(id);
  const value = await apiRequest<unknown>(
    `/admin/submissions/${submissionId}`,
    { token, signal },
  );
  return readSubmissionDetail(value, submissionId);
}

export async function getAdminSubmissionHistory(
  id: string,
  page: number,
  token: string,
  signal?: AbortSignal,
): Promise<AdminSubmissionHistoryDto> {
  const submissionId = requireSubmissionId(id);
  requireSubmissionPage(page);
  const query = new URLSearchParams({
    page: String(page),
    limit: String(SUBMISSION_HISTORY_PAGE_SIZE),
  });
  const value = await apiRequest<unknown>(
    `/admin/submissions/${submissionId}/history?${query}`,
    { token, signal },
  );
  const result = readSubmissionPage(
    value,
    page,
    SUBMISSION_HISTORY_PAGE_SIZE,
    (item) => readSubmissionRevision(item, submissionId),
  );
  if (
    new Set(result.items.map((item) => item.id)).size !== result.items.length ||
    result.items.some(
      (item, index, items) =>
        index > 0 &&
        (items[index - 1].version <= item.version ||
          items[index - 1].record.type !== item.record.type ||
          items[index - 1].record.property.id !== item.record.property.id),
    )
  )
    throw invalidSubmissionResponse();
  return result;
}

export async function getAdminSubmissionPhoto(
  id: string,
  revisionId: string,
  photoId: string,
  token: string,
  signal?: AbortSignal,
): Promise<AdminSubmissionPhotoViewDto> {
  const submissionId = requireSubmissionId(id);
  const revision = requireSubmissionId(revisionId);
  const photo = requireSubmissionId(photoId);
  const value = await apiRequest<unknown>(
    `/admin/submissions/${submissionId}/revisions/${revision}/photos/${photo}/view`,
    { token, signal },
  );
  return readSubmissionPhotoView(value);
}
