import type { StartStaffDraftDto } from '../staff-drafts/staff-drafts.types';

type StaffHome = {
  propertyId: string;
  draftToken: string;
  qrToken: string;
  expiresAt: number;
};

// Only validated start receipts enter this map. Credentials remain in memory,
// never in browser storage, history state, or map keys.
const homes = new Map<string, StaffHome>();

function pruneHomes() {
  for (const [id, home] of homes)
    if (home.expiresAt <= Date.now()) homes.delete(id);
}

export function rememberStaffHome(start: StartStaffDraftDto, qrToken: string) {
  pruneHomes();
  homes.delete(start.draft.id);
  homes.set(start.draft.id, {
    propertyId: start.draft.property.id,
    draftToken: start.accessToken,
    qrToken,
    expiresAt: Date.parse(start.expiresAt),
  });
  if (homes.size > 20) {
    const oldest = homes.keys().next().value;
    if (oldest !== undefined) homes.delete(oldest);
  }
}

export function staffHomePath(
  draftId: string,
  propertyId: string,
  draftToken: string,
): string | null {
  pruneHomes();
  const home = homes.get(draftId);
  return home &&
    home.propertyId === propertyId &&
    home.draftToken === draftToken
    ? `/staff#token=${home.qrToken}`
    : null;
}
