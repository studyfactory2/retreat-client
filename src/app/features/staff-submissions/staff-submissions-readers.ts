import { ApiRequestError } from '../../core/api/api-error';
import { getSeoulToday } from '../../core/dates/seoul-date';
import { STAFF_PHOTO_MAX_COUNT } from '../staff-draft-photos/staff-draft-photos-validation';
import type { StaffDraftDto } from '../staff-drafts/staff-drafts.types';
import {
  isStaffDraftDate,
  isStaffDraftTimestamp,
} from '../staff-drafts/staff-drafts-validation';
import {
  isStaffEntryId,
  isStaffEntryText,
} from '../staff-entry/staff-entry-validation';
import type {
  StaffSubmissionPhotoInput,
  StaffSubmissionReceiptDto,
} from './staff-submissions.types';
import { invalidStaffSubmissionResponse } from './staff-submissions-validation';

function submissionObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw invalidStaffSubmissionResponse();
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

export function readStaffSubmissionReceipt(
  value: unknown,
): StaffSubmissionReceiptDto {
  const receipt = submissionObject(value);
  if (receipt.type === 'CHECK_IN' || receipt.type === 'CHECK_OUT')
    throw new ApiRequestError(
      '이용객 체크리스트의 제출 내역입니다. 직원 정비 화면에서 확인할 수 없습니다.',
      200,
      'STAFF_SUBMISSION_TYPE_UNSUPPORTED',
    );
  const property = submissionObject(receipt.property);
  if (
    !isStaffEntryId(receipt.id) ||
    receipt.status !== 'SUBMITTED' ||
    receipt.type !== 'MAINTENANCE' ||
    !isStaffEntryId(property.id) ||
    !isStaffEntryText(property.name, 100) ||
    (property.region !== null && !isStaffEntryText(property.region, 100)) ||
    !isStaffDraftDate(receipt.visitDate) ||
    !isStaffDraftTimestamp(receipt.startedAt) ||
    !isStaffDraftTimestamp(receipt.submittedAt) ||
    !isStaffDraftTimestamp(receipt.expiresAt) ||
    receipt.visitDate !== getSeoulToday(new Date(receipt.startedAt)) ||
    receipt.submittedAt < receipt.startedAt ||
    receipt.expiresAt <= receipt.submittedAt ||
    receipt.revision !== 1 ||
    !count(receipt.answeredItemCount, 500) ||
    !count(receipt.photoCount, STAFF_PHOTO_MAX_COUNT) ||
    !count(receipt.reportedIssueCount, 500) ||
    receipt.reportedIssueCount > receipt.answeredItemCount
  )
    throw invalidStaffSubmissionResponse();
  return {
    id: receipt.id.toLowerCase(),
    status: 'SUBMITTED',
    type: 'MAINTENANCE',
    property: {
      id: property.id.toLowerCase(),
      name: property.name,
      region: property.region,
    },
    visitDate: receipt.visitDate,
    startedAt: receipt.startedAt,
    submittedAt: receipt.submittedAt,
    revision: 1,
    answeredItemCount: receipt.answeredItemCount,
    photoCount: receipt.photoCount,
    reportedIssueCount: receipt.reportedIssueCount,
    expiresAt: receipt.expiresAt,
  };
}

export function verifyStaffSubmissionReceipt(
  receipt: StaffSubmissionReceiptDto,
  draft: StaffDraftDto,
  photos: StaffSubmissionPhotoInput[],
): void {
  if (
    receipt.id !== draft.id ||
    receipt.property.id !== draft.property.id ||
    receipt.type !== draft.type ||
    receipt.visitDate !== draft.visitDate ||
    receipt.startedAt !== draft.startedAt ||
    receipt.expiresAt !== draft.expiresAt ||
    receipt.answeredItemCount !== draft.answers.items.length ||
    receipt.reportedIssueCount !==
      draft.answers.items.filter((answer) => answer.value === 'ABNORMAL')
        .length ||
    receipt.photoCount !== photos.length
  )
    throw invalidStaffSubmissionResponse();
}
