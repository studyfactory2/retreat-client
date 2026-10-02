import { apiRequest } from '../../core/api/api-client';
import { requireDraftToken } from '../guest-drafts/guest-drafts-validation';
import { isGuestId } from '../guest-entry/guest-entry-validation';
import {
  readGuestSubmissionCorrection,
  readGuestSubmissionDetail,
  readGuestSubmissionPhotoView,
} from './guest-submission-details-readers';
import type {
  GuestCorrectionInput,
  GuestSubmissionCorrectionDto,
  GuestSubmissionDetailDto,
  GuestSubmissionPhotoViewDto,
} from './guest-submission-details.types';
import {
  invalidGuestCorrectionInput,
  readPreparedGuestCorrection,
} from './guest-submission-details-validation';

export async function getGuestSubmissionDetail(
  token: string,
  signal?: AbortSignal,
): Promise<GuestSubmissionDetailDto> {
  requireDraftToken(token);
  return readGuestSubmissionDetail(
    await apiRequest<unknown>('/guest/submissions/current', { token, signal }),
  );
}

export async function getGuestSubmissionPhotoView(
  id: string,
  token: string,
  signal?: AbortSignal,
): Promise<GuestSubmissionPhotoViewDto> {
  requireDraftToken(token);
  if (!isGuestId(id))
    throw invalidGuestCorrectionInput('사진 정보를 확인해 주세요.');
  return readGuestSubmissionPhotoView(
    await apiRequest<unknown>(
      `/guest/submissions/photos/${id.toLowerCase()}/view`,
      { token, signal },
    ),
  );
}

export async function correctGuestSubmission(
  base: GuestSubmissionDetailDto,
  input: GuestCorrectionInput,
  token: string,
  signal?: AbortSignal,
): Promise<GuestSubmissionCorrectionDto> {
  requireDraftToken(token);
  const captured = readGuestSubmissionDetail(base);
  const body = readPreparedGuestCorrection(captured, input);
  return readGuestSubmissionCorrection(
    await apiRequest<unknown>('/guest/submissions/correct', {
      method: 'POST',
      token,
      signal,
      body: {
        expectedRevision: body.expectedRevision,
        items: body.items.map((answer) => ({ ...answer })),
        generalNote: body.generalNote,
        ...(body.reason === undefined ? {} : { reason: body.reason }),
      },
    }),
    captured,
    body,
  );
}
