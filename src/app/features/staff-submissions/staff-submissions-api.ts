import { apiRequest } from '../../core/api/api-client';
import { ApiRequestError } from '../../core/api/api-error';
import { readStaffDraft } from '../staff-drafts/staff-drafts-readers';
import type { StaffDraftDto } from '../staff-drafts/staff-drafts.types';
import { requireStaffDraftToken } from '../staff-drafts/staff-drafts-validation';
import {
  readStaffSubmissionReceipt,
  verifyStaffSubmissionReceipt,
} from './staff-submissions-readers';
import type {
  StaffSubmissionPhotoInput,
  StaffSubmissionReceiptDto,
} from './staff-submissions.types';
import {
  assertStaffChecklistComplete,
  prepareStaffSubmissionPhotos,
} from './staff-submissions-validation';

export async function getStaffSubmissionReceipt(
  token: string,
  signal?: AbortSignal,
): Promise<StaffSubmissionReceiptDto | null> {
  requireStaffDraftToken(token);
  try {
    return readStaffSubmissionReceipt(
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

export async function submitStaffChecklist(
  draft: StaffDraftDto,
  photos: StaffSubmissionPhotoInput[],
  token: string,
  signal?: AbortSignal,
): Promise<StaffSubmissionReceiptDto> {
  requireStaffDraftToken(token);
  const base = readStaffDraft(draft);
  assertStaffChecklistComplete(base);
  const preparedPhotos = prepareStaffSubmissionPhotos(base, photos);
  // Submit only saved answers. Receipt lookup, reconciliation and any deliberate
  // exact replay are owned by the screen; never retry a write automatically.
  const receipt = readStaffSubmissionReceipt(
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
  verifyStaffSubmissionReceipt(receipt, base, preparedPhotos);
  return receipt;
}
