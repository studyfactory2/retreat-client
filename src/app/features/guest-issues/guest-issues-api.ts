import { apiRequest } from '../../core/api/api-client';
import { isGuestId } from '../guest-entry/guest-entry-validation';
import {
  readGuestIssueCategories,
  readGuestIssueReceipt,
  invalidGuestIssueResponse,
} from './guest-issues-readers';
import type {
  GuestIssueCategoryListDto,
  GuestIssueReceiptDto,
  GuestIssueReportInput,
} from './guest-issues.types';
import {
  invalidGuestIssueInput,
  prepareGuestIssueReport,
  requireGuestIssueQrToken,
} from './guest-issues-validation';

export async function getGuestIssueCategories(
  qrToken: string,
  signal?: AbortSignal,
): Promise<GuestIssueCategoryListDto> {
  requireGuestIssueQrToken(qrToken);
  return readGuestIssueCategories(
    await apiRequest<unknown>('/guest/issues/categories', {
      token: qrToken,
      signal,
    }),
  );
}

export async function reportGuestIssue(
  input: GuestIssueReportInput,
  qrToken: string,
  expectedPropertyId: string,
  signal?: AbortSignal,
): Promise<GuestIssueReceiptDto> {
  requireGuestIssueQrToken(qrToken);
  if (!isGuestId(expectedPropertyId))
    throw invalidGuestIssueInput('휴양소 정보를 다시 확인해 주세요.');
  const body = prepareGuestIssueReport(input);
  const receipt = readGuestIssueReceipt(
    await apiRequest<unknown>('/guest/issues/report', {
      method: 'POST',
      token: qrToken,
      signal,
      body: {
        requestKey: body.requestKey,
        categoryId: body.categoryId,
        guestName: body.guestName,
        title: body.title,
        description: body.description,
        isUrgent: body.isUrgent,
        photos: body.photos.map(({ id, token }) => ({ id, token })),
      },
    }),
    expectedPropertyId,
  );
  if (receipt.isUrgent !== body.isUrgent) throw invalidGuestIssueResponse();
  return receipt;
}
