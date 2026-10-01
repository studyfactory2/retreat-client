import { apiRequest } from '../../core/api/api-client';
import type {
  GuestAccessKind,
  GuestEntryContext,
  GuestPropertyGuideDto,
} from './guest-entry.types';
import {
  readGuestPropertyGuide,
  readGuestQrContext,
  readGuestStayContext,
} from './guest-entry-readers';
import { requireGuestAccessInput } from './guest-entry-validation';

export async function getGuestEntryContext(
  kind: GuestAccessKind,
  token: string,
  signal?: AbortSignal,
): Promise<GuestEntryContext> {
  requireGuestAccessInput(kind, token);
  if (kind === 'qr') {
    return {
      kind,
      context: readGuestQrContext(
        await apiRequest<unknown>('/qr/guest', { token, signal }),
      ),
    };
  }
  return {
    kind,
    context: readGuestStayContext(
      await apiRequest<unknown>('/guest/stays/current', { token, signal }),
    ),
  };
}

export async function getGuestPropertyGuide(
  kind: GuestAccessKind,
  token: string,
  signal?: AbortSignal,
): Promise<GuestPropertyGuideDto> {
  requireGuestAccessInput(kind, token);
  return readGuestPropertyGuide(
    await apiRequest<unknown>(`/guest/property-guides/${kind}`, { token, signal }),
  );
}
