import { apiRequest } from '../../core/api/api-client';
import { ApiRequestError } from '../../core/api/api-error';
import { readGuestDraft } from '../guest-drafts/guest-drafts-readers';
import { getGuestSubmissionReceipt } from '../guest-submissions/guest-submissions-api';
import { getStaffSubmissionReceipt } from '../staff-submissions/staff-submissions-api';
import { readStaffDraft } from '../staff-drafts/staff-drafts-readers';
import { requireStaffDraftToken } from '../staff-drafts/staff-drafts-validation';

export async function getPrivateDraftRole(
  token: string,
  signal?: AbortSignal,
): Promise<'guest' | 'staff'> {
  requireStaffDraftToken(token);
  let value: unknown;
  try {
    value = await apiRequest<unknown>('/submission-drafts/current', {
      token,
      signal,
    });
  } catch (error) {
    if (!(error instanceof ApiRequestError) || error.status !== 401)
      throw error;
    // Existing guest private links also reopen completed guest receipts.
    // A submitted staff draft must never enter an editable guest screen.
    try {
      const receipt = await getGuestSubmissionReceipt(token, signal);
      if (receipt && Date.parse(receipt.expiresAt) > Date.now()) return 'guest';
    } catch (receiptError) {
      if (
        receiptError instanceof ApiRequestError &&
        receiptError.code === 'GUEST_SUBMISSION_TYPE_UNSUPPORTED'
      ) {
        const receipt = await getStaffSubmissionReceipt(token, signal);
        if (receipt && Date.parse(receipt.expiresAt) > Date.now())
          return 'staff';
      }
      if (
        !(receiptError instanceof ApiRequestError) ||
        (receiptError.status !== 401 &&
          receiptError.status !== 403 &&
          receiptError.code !== 'GUEST_SUBMISSION_TYPE_UNSUPPORTED')
      )
        throw receiptError;
    }
    throw error;
  }
  const staff =
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    value.type === 'MAINTENANCE';
  const draft = staff ? readStaffDraft(value) : readGuestDraft(value);
  if (Date.parse(draft.expiresAt) <= Date.now())
    throw new ApiRequestError(
      '작성 링크를 사용할 수 없습니다.',
      401,
      'INVALID_DRAFT_ACCESS',
    );
  return staff ? 'staff' : 'guest';
}
