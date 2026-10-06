import type { Location } from 'react-router-dom';

export interface NavigationPosition {
  location: Location;
  index: number | null;
}

export interface NavigationState {
  accepted: NavigationPosition;
  pending: NavigationPosition | null;
  restoring: boolean;
}

export function sameDestination(a: Location, b: Location): boolean {
  return (
    a.pathname === b.pathname && a.search === b.search && a.hash === b.hash
  );
}

// Keep the accepted Location (and its editor) mounted until leaving is approved.
export function reviewNavigation(
  state: NavigationState,
  next: NavigationPosition,
  blocked: boolean,
): NavigationState {
  if (sameDestination(state.accepted.location, next.location)) {
    return { accepted: next, pending: null, restoring: false };
  }
  if (blocked || state.pending || state.restoring)
    return { ...state, pending: next };
  return { accepted: next, pending: null, restoring: false };
}
