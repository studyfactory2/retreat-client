import { ApiRequestError } from '../../../../core/api/api-error';

export type QueuedGuestPhoto = {
  id: number;
  file: File;
  status: 'queued' | 'uploading' | 'failed' | 'uncertain';
  message: string;
  checked: boolean;
};

export function isPhotoAccessError(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    (error.status === 401 || error.status === 403)
  );
}

export function isPhotoWriteUncertain(error: unknown): boolean {
  return (
    !(error instanceof ApiRequestError) ||
    error.status === null ||
    error.status < 400 ||
    error.status >= 500 ||
    error.status === 408
  );
}

export function photoFailureMessage(error: unknown): string {
  if (!(error instanceof ApiRequestError))
    return '사진을 처리하지 못했습니다. 잠시 후 다시 확인해 주세요.';
  if (error.status === 429)
    return '요청이 많습니다. 잠시 기다린 뒤 다시 시도해 주세요.';
  if (error.status === 415)
    return 'JPEG, PNG, WebP 사진만 추가할 수 있습니다. HEIC·HEIF 사진은 JPEG로 변환한 뒤 선택해 주세요.';
  if (error.status === 413)
    return '사진 한 장의 크기는 최대 10MB입니다. 더 작은 사진을 선택해 주세요.';
  return error.message;
}

export function formatGuestPhotoSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)}MB`
    : `${Math.ceil(bytes / 1024)}KB`;
}

export const uncertainPhotoMessage =
  '사진이 이미 올라갔을 수 있습니다. 사진 목록을 다시 확인한 뒤 이 선택을 닫아 주세요. 같은 사진을 다시 선택하면 중복으로 올라갈 수 있습니다.';
