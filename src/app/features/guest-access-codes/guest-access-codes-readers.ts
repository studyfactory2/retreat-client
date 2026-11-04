import { ApiRequestError } from '../../core/api/api-error';
import {
  isGuestId,
  isGuestTimestamp,
} from '../guest-entry/guest-entry-validation';
import type {
  GuestAccessCodeKind,
  GuestAccessCodeRevealDto,
  GuestAccessCodeScope,
  GuestAccessCodesDto,
} from './guest-access-codes.types';

export function invalidGuestAccessCodes(): ApiRequestError {
  return new ApiRequestError(
    '비밀번호 정보를 확인하지 못했습니다. 다시 불러와 주세요.',
    200,
    'INVALID_GUEST_ACCESS_CODES_RESPONSE',
  );
}

export function isGuestCodeFingerprint(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}

function scopedObject(
  value: unknown,
  scope: GuestAccessCodeScope,
): Record<string, unknown> {
  if (
    !isGuestId(scope.stayId) ||
    !isGuestId(scope.propertyId) ||
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  )
    throw invalidGuestAccessCodes();
  const object = value as Record<string, unknown>;
  if (
    !isGuestId(object.stayId) ||
    object.stayId.toLowerCase() !== scope.stayId.toLowerCase() ||
    !isGuestId(object.propertyId) ||
    object.propertyId.toLowerCase() !== scope.propertyId.toLowerCase()
  )
    throw invalidGuestAccessCodes();
  return object;
}

export function readGuestAccessCodes(
  value: unknown,
  scope: GuestAccessCodeScope,
): GuestAccessCodesDto {
  const data = scopedObject(value, scope);
  if (
    !['SCHEDULED', 'AVAILABLE', 'ENDED', 'UNAVAILABLE'].includes(
      data.state as string,
    ) ||
    !isGuestTimestamp(data.opensAt) ||
    !isGuestTimestamp(data.closesAt) ||
    !isGuestTimestamp(data.serverTime) ||
    typeof data.entranceAvailable !== 'boolean' ||
    typeof data.roomAvailable !== 'boolean' ||
    !['ROTATING', 'FIXED', null].includes(data.roomMode as string | null) ||
    (data.fingerprint !== null && !isGuestCodeFingerprint(data.fingerprint))
  )
    throw invalidGuestAccessCodes();
  const open = Date.parse(data.opensAt);
  const close = Date.parse(data.closesAt);
  const now = Date.parse(data.serverTime);
  if (
    open >= close ||
    (data.state === 'SCHEDULED' && now >= open) ||
    (data.state === 'ENDED' && now < close) ||
    (['AVAILABLE', 'UNAVAILABLE'].includes(data.state as string) &&
      (now < open || now >= close)) ||
    (data.state === 'AVAILABLE'
      ? !data.roomAvailable ||
        data.roomMode === null ||
        data.fingerprint === null
      : data.entranceAvailable ||
        data.roomAvailable ||
        data.fingerprint !== null)
  )
    throw invalidGuestAccessCodes();
  return {
    stayId: scope.stayId.toLowerCase(),
    propertyId: scope.propertyId.toLowerCase(),
    state: data.state as GuestAccessCodesDto['state'],
    opensAt: data.opensAt,
    closesAt: data.closesAt,
    serverTime: data.serverTime,
    entranceAvailable: data.entranceAvailable,
    roomAvailable: data.roomAvailable,
    roomMode: data.roomMode as GuestAccessCodesDto['roomMode'],
    fingerprint: data.fingerprint as string | null,
  };
}

export function readGuestAccessCodeReveal(
  value: unknown,
  metadata: GuestAccessCodesDto,
  kind: GuestAccessCodeKind,
): GuestAccessCodeRevealDto {
  const data = scopedObject(value, metadata);
  if (
    metadata.state !== 'AVAILABLE' ||
    !isGuestCodeFingerprint(metadata.fingerprint) ||
    data.fingerprint !== metadata.fingerprint ||
    data.kind !== kind ||
    !['ENTRANCE', 'ROOM'].includes(kind) ||
    (kind === 'ENTRANCE' && !metadata.entranceAvailable) ||
    !isGuestTimestamp(data.serverTime) ||
    !isGuestTimestamp(data.visibleUntil) ||
    typeof data.code !== 'string' ||
    !/^[0-9*#]{1,32}$/.test(data.code) ||
    (kind === 'ROOM' &&
      metadata.roomMode === 'ROTATING' &&
      !/^\d{6}$/.test(data.code))
  )
    throw invalidGuestAccessCodes();
  const now = Date.parse(data.serverTime);
  const until = Date.parse(data.visibleUntil);
  if (
    now < Date.parse(metadata.opensAt) ||
    now >= Date.parse(metadata.closesAt) ||
    until <= now ||
    until > now + 30_000 ||
    until > Date.parse(metadata.closesAt)
  )
    throw invalidGuestAccessCodes();
  return {
    stayId: metadata.stayId,
    propertyId: metadata.propertyId,
    kind,
    code: data.code,
    fingerprint: metadata.fingerprint,
    serverTime: data.serverTime,
    visibleUntil: data.visibleUntil,
  };
}
