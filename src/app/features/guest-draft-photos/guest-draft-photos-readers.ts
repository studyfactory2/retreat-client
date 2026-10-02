import {
  isGuestId,
  isGuestText,
  isGuestTimestamp,
} from '../guest-entry/guest-entry-validation';
import type {
  GuestDraftPhotoDto,
  GuestDraftPhotoListDto,
  GuestDraftPhotoViewDto,
  RemovedGuestDraftPhotoDto,
} from './guest-draft-photos.types';
import {
  GUEST_PHOTO_ACCEPTED_TYPES,
  GUEST_PHOTO_MAX_BYTES,
  GUEST_PHOTO_MAX_COUNT,
  invalidGuestPhotoResponse,
} from './guest-draft-photos-validation';

function photoObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw invalidGuestPhotoResponse();
  return value as Record<string, unknown>;
}

function boundedInteger(
  value: unknown,
  min: number,
  max: number,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= min &&
    value <= max
  );
}

export function readGuestDraftPhoto(value: unknown): GuestDraftPhotoDto {
  const photo = photoObject(value);
  if (
    !isGuestId(photo.id) ||
    photo.status !== 'READY' ||
    typeof photo.filename !== 'string' ||
    photo.filename.trim().length === 0 ||
    [...photo.filename].length > 150 ||
    photo.contentType !== 'image/jpeg' ||
    !boundedInteger(photo.sizeBytes, 1, GUEST_PHOTO_MAX_BYTES) ||
    !boundedInteger(photo.width, 1, 2560) ||
    !boundedInteger(photo.height, 1, 2560) ||
    !isGuestTimestamp(photo.createdAt)
  )
    throw invalidGuestPhotoResponse();
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

export function readGuestDraftPhotos(value: unknown): GuestDraftPhotoListDto {
  const list = photoObject(value);
  const limits = photoObject(list.limits);
  const acceptedTypes = limits.acceptedTypes;
  if (
    !Array.isArray(list.items) ||
    list.items.length > GUEST_PHOTO_MAX_COUNT ||
    limits.maxBytes !== GUEST_PHOTO_MAX_BYTES ||
    limits.maxPhotos !== GUEST_PHOTO_MAX_COUNT ||
    !Array.isArray(acceptedTypes) ||
    acceptedTypes.length !== GUEST_PHOTO_ACCEPTED_TYPES.length ||
    GUEST_PHOTO_ACCEPTED_TYPES.some((type) => !acceptedTypes.includes(type))
  )
    throw invalidGuestPhotoResponse();
  const items = list.items.map(readGuestDraftPhoto);
  if (new Set(items.map((photo) => photo.id)).size !== items.length)
    throw invalidGuestPhotoResponse();
  return {
    items,
    limits: {
      maxBytes: GUEST_PHOTO_MAX_BYTES,
      maxPhotos: GUEST_PHOTO_MAX_COUNT,
      acceptedTypes: [...GUEST_PHOTO_ACCEPTED_TYPES],
    },
  };
}

export function readGuestDraftPhotoView(
  value: unknown,
  allowLoopbackHttp = import.meta.env.DEV,
): GuestDraftPhotoViewDto {
  const view = photoObject(value);
  if (!isGuestText(view.url, 32768) || !isGuestTimestamp(view.expiresAt))
    throw invalidGuestPhotoResponse();
  let parsed: URL;
  try {
    parsed = new URL(view.url);
  } catch {
    throw invalidGuestPhotoResponse();
  }
  const localHttp =
    allowLoopbackHttp &&
    parsed.protocol === 'http:' &&
    ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  // Match the existing private-photo protocol and credential rules. Signed URLs
  // are rendered directly; the draft Bearer must never be sent to this origin.
  if (
    (parsed.protocol !== 'https:' && !localHttp) ||
    !parsed.hostname ||
    parsed.username ||
    parsed.password ||
    parsed.hash ||
    view.url.includes('\\') ||
    [...view.url].some(
      (character) =>
        character.charCodeAt(0) <= 0x20 || character.charCodeAt(0) === 0x7f,
    )
  )
    throw invalidGuestPhotoResponse();
  return { url: view.url, expiresAt: view.expiresAt };
}

export function readRemovedGuestDraftPhoto(
  value: unknown,
  id: string,
): RemovedGuestDraftPhotoDto {
  const photo = photoObject(value);
  if (
    !isGuestId(photo.id) ||
    photo.id.toLowerCase() !== id ||
    photo.status !== 'DELETED'
  )
    throw invalidGuestPhotoResponse();
  return { id, status: 'DELETED' };
}
