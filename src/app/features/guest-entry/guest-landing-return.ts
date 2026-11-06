import type { Path } from 'react-router-dom';

export type GuestReturnTarget = Pick<Path, 'pathname' | 'hash'> & { search?: string };

// Keep only the latest handoff in this document. History receives an opaque ID.
let handoff: { id: string; target: GuestReturnTarget } | null = null;

export function guestLandingState(target: GuestReturnTarget) {
  const id = crypto.randomUUID();
  handoff = { id, target };
  return { guestReturnId: id };
}

export function readGuestLandingReturn(state: unknown): GuestReturnTarget | null {
  if (!handoff || !state || typeof state !== 'object' || !('guestReturnId' in state))
    return null;
  return state.guestReturnId === handoff.id ? handoff.target : null;
}
