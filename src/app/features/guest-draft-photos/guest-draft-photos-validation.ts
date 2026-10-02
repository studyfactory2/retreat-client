import { ApiRequestError } from '../../core/api/api-error';
import { isGuestId } from '../guest-entry/guest-entry-validation';

export const GUEST_PHOTO_MAX_BYTES = 10 * 1024 * 1024;
export const GUEST_PHOTO_MAX_COUNT = 40;
export const GUEST_PHOTO_ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export function invalidGuestPhotoResponse(): ApiRequestError {
  return new ApiRequestError(
    '사진 처리 결과를 확인할 수 없습니다. 사진 목록을 다시 확인해 주세요.',
    200,
    'INVALID_GUEST_PHOTO_RESPONSE',
  );
}

export function requireGuestPhotoId(value: unknown): string {
  if (!isGuestId(value))
    throw new ApiRequestError(
      '사진 정보를 확인해 주세요.',
      400,
      'INVALID_GUEST_PHOTO_INPUT',
    );
  return value.toLowerCase();
}

function unsupportedPhoto(): ApiRequestError {
  return new ApiRequestError(
    '움직이지 않는 JPEG, PNG, WebP 사진만 가능합니다. HEIC 사진은 JPEG로 변환해 주세요.',
    415,
    'PHOTO_FORMAT_UNSUPPORTED',
  );
}

export async function validateGuestPhotoFile(file: File): Promise<void> {
  if (!(file instanceof File) || file.size === 0)
    throw new ApiRequestError(
      '정상적인 사진 파일을 선택해 주세요.',
      400,
      'INVALID_GUEST_PHOTO_INPUT',
    );
  if (file.size > GUEST_PHOTO_MAX_BYTES)
    throw new ApiRequestError(
      '사진은 한 장당 10MiB 이하로 선택해 주세요.',
      413,
      'PHOTO_TOO_LARGE',
    );
  if (
    file.type &&
    !GUEST_PHOTO_ACCEPTED_TYPES.some((type) => type === file.type)
  )
    throw unsupportedPhoto();
  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  } catch {
    throw new ApiRequestError(
      '사진 파일을 읽을 수 없습니다. 다시 선택해 주세요.',
      400,
      'INVALID_GUEST_PHOTO_INPUT',
    );
  }
  const jpeg =
    bytes.length >= 3 &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255;
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every(
    (value, index) => bytes[index] === value,
  );
  const webp =
    bytes.length >= 12 &&
    [82, 73, 70, 70].every((value, index) => bytes[index] === value) &&
    [87, 69, 66, 80].every((value, index) => bytes[index + 8] === value);
  if (!jpeg && !png && !webp) throw unsupportedPhoto();
  // This is a quick file-format check. The server decodes the actual image,
  // rejects animation/pixel overflow and strips metadata when re-encoding it.
}
