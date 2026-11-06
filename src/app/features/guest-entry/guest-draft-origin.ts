import type { StartGuestDraftDto } from '../guest-drafts/guest-drafts.types';
import type { GuestAccessKind } from './guest-entry.types';

type DraftReference = { id: string; property: { id: string } };
type GuestDraftOrigin = {
  kind: GuestAccessKind;
  entryToken: string;
  draftToken: string;
  propertyId: string;
  expiresAt: number;
};

// A private submission link alone grants no access to the QR or stay home.
// Only keep the association for this browser document, following a verified start.
const origins = new Map<string, GuestDraftOrigin>();

export function rememberGuestDraftOrigin(
  start: StartGuestDraftDto,
  kind: GuestAccessKind,
  entryToken: string,
) {
  for (const [id, origin] of origins) {
    if (origin.expiresAt <= Date.now()) origins.delete(id);
  }
  origins.delete(start.draft.id);
  origins.set(start.draft.id, {
    kind,
    entryToken,
    draftToken: start.accessToken,
    propertyId: start.draft.property.id,
    expiresAt: Date.parse(start.expiresAt),
  });
  if (origins.size > 20) {
    const oldest = origins.keys().next().value;
    if (oldest !== undefined) origins.delete(oldest);
  }
}

export function guestDraftOrigin(record: DraftReference, draftToken: string) {
  const origin = origins.get(record.id);
  if (
    !origin ||
    origin.expiresAt <= Date.now() ||
    origin.propertyId !== record.property.id ||
    origin.draftToken !== draftToken
  ) return null;
  return { kind: origin.kind, hash: `#token=${origin.entryToken}` };
}
