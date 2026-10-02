import { ApiRequestError } from '../../core/api/api-error';
import type { GuestDraftDto } from '../guest-drafts/guest-drafts.types';
import {
  isGuestDraftDate,
  isGuestDraftType,
} from '../guest-drafts/guest-drafts-validation';
import {
  isGuestId,
  isGuestText,
  isGuestTimestamp,
} from '../guest-entry/guest-entry-validation';
import type {
  GuestSubmissionPhotoInput,
  GuestSubmissionReceiptDto,
} from './guest-submissions.types';
import { invalidGuestSubmissionResponse } from './guest-submissions-validation';

function submissionObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw invalidGuestSubmissionResponse();
  return value as Record<string, unknown>;
}

function count(value: unknown, maximum: number): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= maximum
  );
}

export function readGuestSubmissionReceipt(
  value: unknown,
): GuestSubmissionReceiptDto {
  const receipt = submissionObject(value);
  if (receipt.type === 'MAINTENANCE')
    throw new ApiRequestError(
      '직원 정비 체크리스트의 제출 내역입니다. 이용객 화면에서 확인할 수 없습니다.',
      200,
      'GUEST_SUBMISSION_TYPE_UNSUPPORTED',
    );
  const property = submissionObject(receipt.property);
  if (
    !isGuestId(receipt.id) ||
    receipt.status !== 'SUBMITTED' ||
    !isGuestDraftType(receipt.type) ||
    !isGuestId(property.id) ||
    !isGuestText(property.name, 100) ||
    (property.region !== null && !isGuestText(property.region, 100)) ||
    !isGuestDraftDate(receipt.visitDate) ||
    receipt.startedAt !== null ||
    receipt.revision !== 1 ||
    !isGuestTimestamp(receipt.submittedAt) ||
    !isGuestTimestamp(receipt.expiresAt) ||
    receipt.expiresAt <= receipt.submittedAt ||
    !count(receipt.answeredItemCount, 500) ||
    !count(receipt.photoCount, 40) ||
    !count(receipt.reportedIssueCount, 500) ||
    receipt.reportedIssueCount > receipt.answeredItemCount ||
    (receipt.reportedIssueCount === 0 && receipt.photoCount > 0)
  )
    throw invalidGuestSubmissionResponse();
  return {
    id: receipt.id.toLowerCase(),
    status: 'SUBMITTED',
    type: receipt.type,
    property: {
      id: property.id.toLowerCase(),
      name: property.name,
      region: property.region,
    },
    visitDate: receipt.visitDate,
    startedAt: null,
    submittedAt: receipt.submittedAt,
    revision: 1,
    answeredItemCount: receipt.answeredItemCount,
    photoCount: receipt.photoCount,
    reportedIssueCount: receipt.reportedIssueCount,
    expiresAt: receipt.expiresAt,
  };
}

export function verifyGuestSubmissionReceipt(
  receipt: GuestSubmissionReceiptDto,
  draft: GuestDraftDto,
  photos: GuestSubmissionPhotoInput[],
): void {
  if (
    receipt.id !== draft.id ||
    receipt.property.id !== draft.property.id ||
    receipt.type !== draft.type ||
    receipt.visitDate !== draft.visitDate ||
    receipt.expiresAt !== draft.expiresAt ||
    receipt.submittedAt < draft.createdAt ||
    receipt.answeredItemCount !== draft.answers.items.length ||
    receipt.reportedIssueCount !==
      draft.answers.items.filter((answer) => answer.value === 'ABNORMAL')
        .length ||
    receipt.photoCount !== photos.length
  )
    throw invalidGuestSubmissionResponse();
}
