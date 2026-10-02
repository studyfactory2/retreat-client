import { ApiRequestError } from '../../core/api/api-error';
import {
  readGuestDraftPhoto,
  readGuestDraftPhotoView,
  readRemovedGuestDraftPhoto,
} from '../guest-draft-photos/guest-draft-photos-readers';
import {
  isGuestAccessToken,
  isGuestTimestamp,
} from '../guest-entry/guest-entry-validation';
import type {
  GuestIssuePhotoUploadDto,
  GuestIssuePhotoViewDto,
  RemovedGuestIssuePhotoDto,
} from './guest-issues.types';

export function invalidGuestIssuePhotoResponse(): ApiRequestError {
  return new ApiRequestError(
    '사진 처리 결과를 확인할 수 없습니다. 사진 접근 정보는 복구할 수 없으므로 업로드 결과가 불확실하면 사진을 다시 선택해 주세요.',
    200,
    'INVALID_GUEST_ISSUE_PHOTO_RESPONSE',
  );
}

export function readGuestIssuePhotoUpload(
  value: unknown,
): GuestIssuePhotoUploadDto {
  try {
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw invalidGuestIssuePhotoResponse();
    const upload = value as Record<string, unknown>;
    if (
      Object.keys(upload).some(
        (key) => !['photo', 'token', 'expiresAt'].includes(key),
      ) ||
      !isGuestAccessToken(upload.token) ||
      !isGuestTimestamp(upload.expiresAt)
    )
      throw invalidGuestIssuePhotoResponse();
    const photo = readGuestDraftPhoto(upload.photo);
    if (upload.expiresAt <= photo.createdAt)
      throw invalidGuestIssuePhotoResponse();
    return { photo, token: upload.token, expiresAt: upload.expiresAt };
  } catch {
    throw invalidGuestIssuePhotoResponse();
  }
}

export function readGuestIssuePhotoView(
  value: unknown,
  allowLoopbackHttp = import.meta.env.DEV,
): GuestIssuePhotoViewDto {
  try {
    return readGuestDraftPhotoView(value, allowLoopbackHttp);
  } catch {
    throw invalidGuestIssuePhotoResponse();
  }
}

export function readRemovedGuestIssuePhoto(
  value: unknown,
  id: string,
): RemovedGuestIssuePhotoDto {
  try {
    return readRemovedGuestDraftPhoto(value, id.toLowerCase());
  } catch {
    throw invalidGuestIssuePhotoResponse();
  }
}
