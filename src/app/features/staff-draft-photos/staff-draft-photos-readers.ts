import {
  isStaffEntryId,
  isStaffEntryText,
} from '../staff-entry/staff-entry-validation';
import { isStaffDraftTimestamp } from '../staff-drafts/staff-drafts-validation';
import type {
  RemovedStaffDraftPhotoDto,
  StaffDraftPhotoDto,
  StaffDraftPhotoListDto,
  StaffDraftPhotoViewDto,
} from './staff-draft-photos.types';
import {
  invalidStaffPhotoResponse,
  isStaffPhotoLimits,
  STAFF_PHOTO_MAX_BYTES,
  STAFF_PHOTO_MAX_COUNT,
} from './staff-draft-photos-validation';

function photoObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw invalidStaffPhotoResponse();
  return value as Record<string, unknown>;
}

function boundedInteger(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= minimum &&
    value <= maximum
  );
}

export function readStaffDraftPhoto(value: unknown): StaffDraftPhotoDto {
  const photo = photoObject(value);
  if (
    !isStaffEntryId(photo.id) ||
    photo.status !== 'READY' ||
    typeof photo.filename !== 'string' ||
    !photo.filename.trim() ||
    [...photo.filename].length > 150 ||
    photo.contentType !== 'image/jpeg' ||
    !boundedInteger(photo.sizeBytes, 1, STAFF_PHOTO_MAX_BYTES) ||
    !boundedInteger(photo.width, 1, 2560) ||
    !boundedInteger(photo.height, 1, 2560) ||
    !isStaffDraftTimestamp(photo.createdAt)
  )
    throw invalidStaffPhotoResponse();
  return {
    id: photo.id.toLowerCase(),
    status: 'READY',
    filename: photo.filename,
    contentType: 'image/jpeg',
    sizeBytes: photo.sizeBytes,
    width: photo.width,
    height: photo.height,
    createdAt: photo.createdAt,
  };
}

export function readStaffDraftPhotos(value: unknown): StaffDraftPhotoListDto {
  const list = photoObject(value);
  if (
    !Array.isArray(list.items) ||
    list.items.length > STAFF_PHOTO_MAX_COUNT ||
    !isStaffPhotoLimits(list.limits)
  )
    throw invalidStaffPhotoResponse();
  const items = Array.from(list.items, readStaffDraftPhoto);
  if (new Set(items.map((photo) => photo.id)).size !== items.length)
    throw invalidStaffPhotoResponse();
  return {
    items,
    limits: {
      maxBytes: list.limits.maxBytes,
      maxPhotos: list.limits.maxPhotos,
      acceptedTypes: [...list.limits.acceptedTypes],
    },
  };
}

export function readStaffDraftPhotoView(
  value: unknown,
  allowLoopbackHttp = import.meta.env.DEV,
): StaffDraftPhotoViewDto {
  const view = photoObject(value);
  if (
    !isStaffEntryText(view.url, 32768) ||
    !isStaffDraftTimestamp(view.expiresAt)
  )
    throw invalidStaffPhotoResponse();
  let parsed: URL;
  try {
    parsed = new URL(view.url);
  } catch {
    throw invalidStaffPhotoResponse();
  }
  const localHttp =
    allowLoopbackHttp &&
    parsed.protocol === 'http:' &&
    ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  if (
    (parsed.protocol !== 'https:' && !localHttp) ||
    !parsed.hostname ||
    parsed.username ||
    parsed.password ||
    view.url.includes('#') ||
    view.url.includes('\\') ||
    [...view.url].some(
      (character) =>
        character.charCodeAt(0) <= 0x20 || character.charCodeAt(0) === 0x7f,
    )
  )
    throw invalidStaffPhotoResponse();
  // Render this short-lived URL directly, without API Bearer headers or storage.
  return { url: view.url, expiresAt: view.expiresAt };
}

export function readRemovedStaffDraftPhoto(
  value: unknown,
  id: string,
): RemovedStaffDraftPhotoDto {
  const photo = photoObject(value);
  if (
    !isStaffEntryId(photo.id) ||
    photo.id.toLowerCase() !== id ||
    photo.status !== 'DELETED'
  )
    throw invalidStaffPhotoResponse();
  return { id, status: 'DELETED' };
}
