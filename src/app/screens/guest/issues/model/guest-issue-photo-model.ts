import { ApiRequestError } from '../../../../core/api/api-error';
import type { GuestDraftPhotoDto } from '../../../../features/guest-draft-photos/guest-draft-photos.types';

export interface GuestIssueReadyPhotoClaim {
  id: string;
  token: string;
  expiresAt: string;
}

export interface GuestIssueManagedPhoto {
  photo: GuestDraftPhotoDto;
  token: string | null;
  expiresAt: string;
  status: 'ready' | 'expired' | 'unavailable' | 'remove-uncertain';
  message: string;
}

export interface GuestIssueQueuedPhoto {
  id: number;
  file: File;
  status: 'queued' | 'uploading' | 'failed' | 'uncertain';
  message: string;
}

export function isIssuePhotoQrRejected(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    (error.status === 401 || error.status === 403) &&
    error.code === 'INVALID_QR'
  );
}

export function isIssuePhotoUnavailable(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    ((error.status === 401 && error.code === 'INVALID_ISSUE_PHOTO_ACCESS') ||
      (error.status === 404 && error.code === 'PHOTO_NOT_FOUND'))
  );
}

export function isIssuePhotoOutcomeUnknown(error: unknown): boolean {
  return (
    !(error instanceof ApiRequestError) ||
    error.status === null ||
    error.status < 400 ||
    error.status >= 500 ||
    error.status === 408
  );
}

export function issuePhotoFailure(error: unknown): string {
  if (!(error instanceof ApiRequestError))
    return '사진을 처리하지 못했습니다. 잠시 후 다시 확인해 주세요.';
  if (error.status === 429)
    return '요청이 많습니다. 잠시 기다린 뒤 다시 시도해 주세요.';
  if (error.status === 413)
    return '사진 한 장의 크기는 최대 10MiB입니다. 더 작은 사진을 선택해 주세요.';
  if (error.status === 415)
    return '움직이지 않는 JPEG, PNG, WebP 사진만 가능합니다. HEIC·HEIF 사진은 JPEG로 변환해 주세요.';
  return error.message;
}

export const issuePhotoUploadUnknown =
  '사진이 올라갔을 수 있지만, 이 사진을 사용할 수 있는 정보를 받지 못했습니다. 다시 불러올 수 없으므로 이 선택을 포기한 뒤 필요하면 사진을 새로 선택해 주세요. 기존 사진은 이 신고에 첨부되지 않으며 미사용 사진 정리 대상이 됩니다.';
export const issuePhotoRemoveUnknown =
  '사진 삭제 결과를 확인하지 못했습니다. 신고를 보내기 전에 같은 사진의 삭제를 다시 확인해 주세요. 사진 사용 기간이 끝나면 이 목록에서 제외할 수 있습니다.';

export function formatIssuePhotoSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)}MiB`
    : `${Math.ceil(bytes / 1024)}KiB`;
}
