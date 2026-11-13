import {
  GUIDE_PDF_MAX_BYTES,
  requireGuidePdfVersion,
  validateGuidePdfBlob,
} from '../property-guide/guide-pdf';
import { apiDownloadWithHeaders, apiRequest } from '../../core/api/api-client';
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
    await apiRequest<unknown>(`/guest/property-guides/${kind}`, {
      token,
      signal,
    }),
  );
}

export async function getGuestPropertyGuidePdf(
  kind: GuestAccessKind,
  token: string,
  version: number,
  signal?: AbortSignal,
): Promise<Blob> {
  requireGuestAccessInput(kind, token);
  const { blob } = await apiDownloadWithHeaders(
    `/guest/property-guides/${kind}/pdf?version=${requireGuidePdfVersion(version)}`,
    { token, signal, timeoutMs: 90_000 },
    GUIDE_PDF_MAX_BYTES,
  );
  return validateGuidePdfBlob(blob);
}
