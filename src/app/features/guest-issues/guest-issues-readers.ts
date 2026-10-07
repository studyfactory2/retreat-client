import { ApiRequestError } from '../../core/api/api-error';
import {
  isGuestId,
  isGuestText,
  isGuestTimestamp,
} from '../guest-entry/guest-entry-validation';
import type {
  GuestIssueCategoryListDto,
  GuestIssueReceiptDto,
} from './guest-issues.types';
import { GUEST_ISSUE_LIMITS } from './guest-issues-validation';

export function invalidGuestIssueResponse(): ApiRequestError {
  return new ApiRequestError(
    '문제 신고 응답을 확인할 수 없습니다. 접수 결과가 불확실하면 보관한 같은 요청으로 다시 확인해 주세요.',
    200,
    'INVALID_GUEST_ISSUE_RESPONSE',
  );
}

function issueObject(value: unknown, keys: string[]): Record<string, unknown> {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).some((key) => !keys.includes(key))
  )
    throw invalidGuestIssueResponse();
  return value as Record<string, unknown>;
}

export function readGuestIssueCategories(
  value: unknown,
): GuestIssueCategoryListDto {
  const list = issueObject(value, ['items']);
  if (!Array.isArray(list.items)) throw invalidGuestIssueResponse();
  const ids = new Set<string>();
  const names = new Set<string>();
  return {
    // This endpoint returns every active category and has no pagination/count
    // limit. Preserve the backend's sort order rather than sorting by browser locale.
    items: Array.from(list.items, (value: unknown) => {
      const item = issueObject(value, ['id', 'name']);
      if (
        !isGuestId(item.id) ||
        !isGuestText(item.name, GUEST_ISSUE_LIMITS.categoryName)
      )
        throw invalidGuestIssueResponse();
      const id = item.id.toLowerCase();
      if (ids.has(id) || names.has(item.name))
        throw invalidGuestIssueResponse();
      ids.add(id);
      names.add(item.name);
      return { id, name: item.name };
    }),
  };
}

export function readGuestIssueReceipt(
  value: unknown,
  expectedPropertyId: string,
): GuestIssueReceiptDto {
  const receipt = issueObject(value, [
    'issueId',
    'status',
    'property',
    'receivedAt',
    'isUrgent',
  ]);
  const property = issueObject(receipt.property, ['id', 'name']);
  if (
    !isGuestId(receipt.issueId) ||
    receipt.status !== 'RECEIVED' ||
    !isGuestId(expectedPropertyId) ||
    !isGuestId(property.id) ||
    property.id.toLowerCase() !== expectedPropertyId.toLowerCase() ||
    !isGuestText(property.name, 100) ||
    !isGuestTimestamp(receipt.receivedAt) ||
    (receipt.isUrgent !== undefined && typeof receipt.isUrgent !== 'boolean')
  )
    throw invalidGuestIssueResponse();
  // Replays contain the original property label and timestamp. A rename or
  // later administrative status change must not invalidate the original receipt.
  return {
    issueId: receipt.issueId.toLowerCase(),
    status: 'RECEIVED',
    property: { id: property.id.toLowerCase(), name: property.name },
    receivedAt: receipt.receivedAt,
    // Receipts saved before urgency existed represent the original false value.
    isUrgent: receipt.isUrgent ?? false,
  };
}
