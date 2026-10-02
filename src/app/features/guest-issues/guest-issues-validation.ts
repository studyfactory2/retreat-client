import { ApiRequestError } from '../../core/api/api-error';
import {
  isGuestAccessToken,
  isGuestId,
} from '../guest-entry/guest-entry-validation';
import type {
  GuestIssuePhotoClaim,
  GuestIssueReportDraft,
  GuestIssueReportInput,
} from './guest-issues.types';

export const GUEST_ISSUE_MAX_PHOTOS = 10;
export const GUEST_ISSUE_LIMITS = {
  categoryName: 100,
  guestName: 100,
  title: 300,
  description: 2000,
} as const;

export function invalidGuestIssueInput(
  message = '문제 신고 내용을 확인해 주세요.',
  field?: string,
): ApiRequestError {
  return new ApiRequestError(
    message,
    400,
    'INVALID_GUEST_ISSUE_INPUT',
    field ? [{ field, messages: [message] }] : [],
  );
}

export function invalidGuestIssuePhotoInput(): ApiRequestError {
  return new ApiRequestError(
    '사진 접근 정보를 확인해 주세요. 사진을 다시 등록해 주세요.',
    400,
    'INVALID_GUEST_ISSUE_PHOTO_INPUT',
  );
}

export function requireGuestIssueQrToken(
  token: unknown,
): asserts token is string {
  if (!isGuestAccessToken(token))
    throw invalidGuestIssueInput('휴양소의 공용 QR 링크를 확인해 주세요.');
}

export function requireGuestIssuePhotoClaim(
  id: unknown,
  token: unknown,
): GuestIssuePhotoClaim {
  if (!isGuestId(id) || !isGuestAccessToken(token))
    throw invalidGuestIssuePhotoInput();
  return { id: id.toLowerCase(), token };
}

function reportObject(
  value: unknown,
  allowed: string[],
): Record<string, unknown> {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).some((key) => !allowed.includes(key))
  )
    throw invalidGuestIssueInput();
  return value as Record<string, unknown>;
}

function reportText(
  value: unknown,
  field: string,
  label: string,
  maximum: number,
): string {
  if (typeof value !== 'string' || !value.trim())
    throw invalidGuestIssueInput(`${label}을 입력해 주세요.`, field);
  const text = value.trim();
  if ([...text].length > maximum)
    throw invalidGuestIssueInput(
      `${label}은 ${maximum}자 이하로 입력해 주세요.`,
      field,
    );
  return text;
}

export function prepareGuestIssueReport(
  input: GuestIssueReportDraft,
): GuestIssueReportInput {
  const draft = reportObject(input, [
    'requestKey',
    'categoryId',
    'guestName',
    'title',
    'description',
    'photos',
  ]);
  if (!isGuestId(draft.requestKey))
    throw invalidGuestIssueInput(
      '신고 요청 정보를 확인해 주세요.',
      'requestKey',
    );
  if (!isGuestId(draft.categoryId))
    throw invalidGuestIssueInput('문제 분류를 선택해 주세요.', 'categoryId');
  const guestName = reportText(
    draft.guestName,
    'guestName',
    '이용객 이름',
    GUEST_ISSUE_LIMITS.guestName,
  );
  const title = reportText(
    draft.title,
    'title',
    '신고 제목',
    GUEST_ISSUE_LIMITS.title,
  );
  let description: string | null = null;
  if (draft.description !== undefined && draft.description !== null) {
    if (
      typeof draft.description !== 'string' ||
      [...draft.description.trim()].length > GUEST_ISSUE_LIMITS.description
    )
      throw invalidGuestIssueInput(
        '신고 내용은 2000자 이하로 입력해 주세요.',
        'description',
      );
    description = draft.description.trim() || null;
  }
  const inputPhotos = draft.photos === undefined ? [] : draft.photos;
  if (
    !Array.isArray(inputPhotos) ||
    inputPhotos.length > GUEST_ISSUE_MAX_PHOTOS
  )
    throw invalidGuestIssueInput(
      '사진은 10장까지 첨부할 수 있습니다.',
      'photos',
    );
  const seen = new Set<string>();
  const photos = Array.from(inputPhotos, (value: unknown) => {
    const photo = reportObject(value, ['id', 'token']);
    if (!isGuestId(photo.id) || !isGuestAccessToken(photo.token))
      throw invalidGuestIssueInput(
        '첨부할 사진의 정보를 확인해 주세요.',
        'photos',
      );
    const id = photo.id.toLowerCase();
    if (seen.has(id))
      throw invalidGuestIssueInput(
        '같은 사진을 중복으로 첨부할 수 없습니다.',
        'photos',
      );
    seen.add(id);
    return Object.freeze({ id, token: photo.token });
  });
  // Retry identity includes the original ordered claims. Expiry is deliberately
  // not checked here: already-submitted evidence may be replayed after upload expiry.
  Object.freeze(photos);
  return Object.freeze({
    requestKey: draft.requestKey.toLowerCase(),
    categoryId: draft.categoryId.toLowerCase(),
    guestName,
    title,
    description,
    photos,
  });
}
