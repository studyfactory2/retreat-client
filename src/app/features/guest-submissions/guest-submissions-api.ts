import { apiRequest } from '../../core/api/api-client';
import { ApiRequestError } from '../../core/api/api-error';
import { readGuestDraft } from '../guest-drafts/guest-drafts-readers';
import type { GuestDraftDto } from '../guest-drafts/guest-drafts.types';
import { requireDraftToken } from '../guest-drafts/guest-drafts-validation';
import {
  readGuestSubmissionReceipt,
  verifyGuestSubmissionReceipt,
} from './guest-submissions-readers';
import type {
  GuestSubmissionPhotoInput,
  GuestSubmissionReceiptDto,
} from './guest-submissions.types';
import {
  assertGuestChecklistComplete,
  prepareGuestSubmissionPhotos,
} from './guest-submissions-validation';

export async function getGuestSubmissionReceipt(
  token: string,
  signal?: AbortSignal,
): Promise<GuestSubmissionReceiptDto | null> {
  requireDraftToken(token);
  try {
    return readGuestSubmissionReceipt(
      await apiRequest<unknown>('/submissions/receipt', { token, signal }),
    );
  } catch (error) {
    if (
      error instanceof ApiRequestError &&
      error.status === 409 &&
      error.code === 'CHECKLIST_NOT_SUBMITTED'
    )
      return null;
    throw error;
  }
}

export async function submitGuestChecklist(
  draft: GuestDraftDto,
  photos: GuestSubmissionPhotoInput[],
  token: string,
  signal?: AbortSignal,
): Promise<GuestSubmissionReceiptDto> {
  requireDraftToken(token);
  const base = readGuestDraft(draft);
  assertGuestChecklistComplete(base);
  const preparedPhotos = prepareGuestSubmissionPhotos(base, photos);
  const receipt = readGuestSubmissionReceipt(
    await apiRequest<unknown>('/submissions/submit', {
      method: 'POST',
      token,
      signal,
      body: {
        expectedUpdatedAt: base.updatedAt,
        photos: preparedPhotos.map((photo) => ({ ...photo })),
      },
    }),
  );
  verifyGuestSubmissionReceipt(receipt, base, preparedPhotos);
  return receipt;
}
