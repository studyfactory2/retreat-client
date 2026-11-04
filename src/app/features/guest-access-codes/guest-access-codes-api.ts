import { apiRequest } from '../../core/api/api-client';
import { requireGuestAccessInput } from '../guest-entry/guest-entry-validation';
import {
  invalidGuestAccessCodes,
  isGuestCodeFingerprint,
  readGuestAccessCodeReveal,
  readGuestAccessCodes,
} from './guest-access-codes-readers';
import type {
  GuestAccessCodeKind,
  GuestAccessCodeScope,
  GuestAccessCodesDto,
} from './guest-access-codes.types';

const path = '/guest/stays/current/access-codes';

export async function getGuestAccessCodes(
  scope: GuestAccessCodeScope,
  token: string,
  signal?: AbortSignal,
) {
  requireGuestAccessInput('stay', token);
  return readGuestAccessCodes(
    await apiRequest<unknown>(path, { token, signal }),
    scope,
  );
}

export async function revealGuestAccessCode(
  metadata: GuestAccessCodesDto,
  kind: GuestAccessCodeKind,
  token: string,
  signal?: AbortSignal,
) {
  requireGuestAccessInput('stay', token);
  if (
    metadata.state !== 'AVAILABLE' ||
    !isGuestCodeFingerprint(metadata.fingerprint) ||
    !['ENTRANCE', 'ROOM'].includes(kind) ||
    (kind === 'ENTRANCE' && !metadata.entranceAvailable)
  )
    throw invalidGuestAccessCodes();
  return readGuestAccessCodeReveal(
    await apiRequest<unknown>(`${path}/reveal`, {
      method: 'POST',
      token,
      signal,
      body: { kind, fingerprint: metadata.fingerprint },
    }),
    metadata,
    kind,
  );
}
