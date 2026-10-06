import { ApiRequestError } from '../../core/api/api-error';
import { isStaffEntryId } from '../staff-entry/staff-entry-validation';
import type {
  StaffDraftPhotoLimitsDto,
  StaffPhotoContentType,
} from './staff-draft-photos.types';

export const STAFF_PHOTO_MAX_BYTES = 10 * 1024 * 1024;
export const STAFF_PHOTO_MAX_COUNT = 40;
export const STAFF_PHOTO_ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;
const unsupportedMessage =
  '움직이지 않는 JPEG, PNG, WebP 사진만 가능합니다. HEIC 사진은 JPEG로 변환해 주세요.';

export function invalidStaffPhotoResponse(): ApiRequestError {
  return new ApiRequestError(
    '사진 처리 결과를 확인할 수 없습니다. 사진 목록을 다시 확인해 주세요.',
    200,
    'INVALID_STAFF_PHOTO_RESPONSE',
  );
}

export function requireStaffPhotoId(value: unknown): string {
  if (!isStaffEntryId(value))
    throw new ApiRequestError(
      '사진 정보를 확인해 주세요.',
      400,
      'INVALID_STAFF_PHOTO_INPUT',
    );
  return value.toLowerCase();
}

export function isStaffPhotoLimits(
  value: unknown,
): value is StaffDraftPhotoLimitsDto {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return false;
  const limits = value as Record<string, unknown>;
  return (
    typeof limits.maxBytes === 'number' &&
    Number.isInteger(limits.maxBytes) &&
    limits.maxBytes >= 1 &&
    limits.maxBytes <= STAFF_PHOTO_MAX_BYTES &&
    typeof limits.maxPhotos === 'number' &&
    Number.isInteger(limits.maxPhotos) &&
    limits.maxPhotos >= 1 &&
    limits.maxPhotos <= STAFF_PHOTO_MAX_COUNT &&
    Array.isArray(limits.acceptedTypes) &&
    limits.acceptedTypes.length >= 1 &&
    limits.acceptedTypes.length <= STAFF_PHOTO_ACCEPTED_TYPES.length &&
    Array.from(limits.acceptedTypes).every((type) =>
      STAFF_PHOTO_ACCEPTED_TYPES.some((accepted) => accepted === type),
    ) &&
    new Set(limits.acceptedTypes).size === limits.acceptedTypes.length
  );
}

function selectionError(
  file: File,
  limits: StaffDraftPhotoLimitsDto,
): ApiRequestError | null {
  if (!isStaffPhotoLimits(limits))
    return new ApiRequestError(
      '사진 목록을 다시 불러온 뒤 선택해 주세요.',
      400,
      'INVALID_STAFF_PHOTO_INPUT',
    );
  if (typeof File === 'undefined' || !(file instanceof File) || file.size === 0)
    return new ApiRequestError(
      '정상적인 사진 파일을 선택해 주세요.',
      400,
      'INVALID_STAFF_PHOTO_INPUT',
    );
  if (file.size > limits.maxBytes)
    return new ApiRequestError(
      `사진은 한 장당 ${Math.round((limits.maxBytes / 1024 / 1024) * 100) / 100}MiB 이하로 선택해 주세요.`,
      413,
      'PHOTO_TOO_LARGE',
    );
  if (file.type && !limits.acceptedTypes.some((type) => type === file.type))
    return new ApiRequestError(
      unsupportedMessage,
      415,
      'PHOTO_FORMAT_UNSUPPORTED',
    );
  return null;
}

export function validateStaffPhotoSelection(
  file: File,
  limits: StaffDraftPhotoLimitsDto,
): string | null {
  return selectionError(file, limits)?.message ?? null;
}

export async function validateStaffPhotoFile(
  file: File,
  limits: StaffDraftPhotoLimitsDto,
): Promise<void> {
  const error = selectionError(file, limits);
  if (error) throw error;
  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  } catch {
    throw new ApiRequestError(
      '사진 파일을 읽을 수 없습니다. 다시 선택해 주세요.',
      400,
      'INVALID_STAFF_PHOTO_INPUT',
    );
  }
  let detected: StaffPhotoContentType | undefined;
  if (
    bytes.length >= 3 &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255
  )
    detected = 'image/jpeg';
  else if (
    [137, 80, 78, 71, 13, 10, 26, 10].every(
      (value, index) => bytes[index] === value,
    )
  )
    detected = 'image/png';
  else if (
    bytes.length >= 12 &&
    [82, 73, 70, 70].every((value, index) => bytes[index] === value) &&
    [87, 69, 66, 80].every((value, index) => bytes[index + 8] === value)
  )
    detected = 'image/webp';
  if (!detected || !limits.acceptedTypes.includes(detected))
    throw new ApiRequestError(
      unsupportedMessage,
      415,
      'PHOTO_FORMAT_UNSUPPORTED',
    );
}
