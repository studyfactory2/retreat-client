import { apiRequest } from '../../core/api/api-client';
import { ApiRequestError } from '../../core/api/api-error';
import type { AdminSubmissionDetail } from './admin-submissions.types';
import type {
  LinkSubmissionStayInput,
  SubmissionStayCandidatesDto,
  SubmissionStayLinkDto,
} from './admin-submission-stays.types';
import {
  readSubmissionStayCandidates,
  readSubmissionStayLink,
} from './admin-submission-stays-readers';
import {
  isSubmissionId,
  requireSubmissionId,
  requireSubmissionPage,
} from './admin-submissions-validation';

export const CANDIDATE_PAGE_SIZE = 20;

export async function getSubmissionStayCandidates(
  detail: AdminSubmissionDetail,
  page: number,
  token: string,
  signal?: AbortSignal,
): Promise<SubmissionStayCandidatesDto> {
  const id = requireSubmissionId(detail.id);
  requireSubmissionPage(page);
  const record = detail.revision.record;
  if (
    detail.status !== 'SUBMITTED' ||
    record.authorSource !== 'GUEST_QR' ||
    (record.type !== 'CHECK_IN' && record.type !== 'CHECK_OUT')
  )
    throw new ApiRequestError(
      '이 기록은 이용 일정 연결 대상이 아닙니다.',
      409,
      'INELIGIBLE_SUBMISSION',
    );
  const query = new URLSearchParams({
    page: String(page),
    limit: String(CANDIDATE_PAGE_SIZE),
  });
  const value = await apiRequest<unknown>(
    `/admin/submissions/${id}/stay-candidates?${query}`,
    { token, signal },
  );
  return readSubmissionStayCandidates(value, detail, page, CANDIDATE_PAGE_SIZE);
}

function isWritableRevision(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 2_147_483_646
  );
}

export async function linkSubmissionStay(
  id: string,
  input: LinkSubmissionStayInput,
  token: string,
  signal?: AbortSignal,
): Promise<SubmissionStayLinkDto> {
  const submissionId = requireSubmissionId(id);
  if (
    !isWritableRevision(input.expectedRevision) ||
    (input.stayId !== null && !isSubmissionId(input.stayId)) ||
    (input.stayId === null
      ? input.expectedStayRevision !== undefined
      : !isWritableRevision(input.expectedStayRevision)) ||
    typeof input.reason !== 'string' ||
    !input.reason.trim() ||
    [...input.reason.trim()].length > 1000
  )
    throw new ApiRequestError(
      '연결할 일정과 변경 사유를 확인해 주세요.',
      400,
      'INVALID_SUBMISSION_STAY_INPUT',
    );
  const common = {
    expectedRevision: input.expectedRevision,
    reason: input.reason.trim(),
  };
  const body: LinkSubmissionStayInput =
    input.stayId === null
      ? { ...common, stayId: null }
      : {
          ...common,
          stayId: input.stayId.toLowerCase(),
          expectedStayRevision: input.expectedStayRevision,
        };
  const value = await apiRequest<unknown>(
    `/admin/submissions/${submissionId}/link-stay`,
    {
      method: 'POST',
      token,
      signal,
      body: {
        expectedRevision: body.expectedRevision,
        stayId: body.stayId,
        reason: body.reason,
        ...(body.stayId === null
          ? {}
          : { expectedStayRevision: body.expectedStayRevision }),
      },
    },
  );
  // A retry receipt can describe an older saved revision. The caller must GET
  // the current detail after this validated acknowledgement, never patch it locally.
  return readSubmissionStayLink(value, submissionId, body);
}
