import { isGuestAccessToken } from '../../../../features/guest-entry/guest-entry-validation';
import type { GuestAccessKind } from '../../../../features/guest-entry/guest-entry.types';

export type GuestView = 'home' | 'guide';
export type GuestAccess =
  | { status: 'ready'; token: string }
  | { status: 'missing' }
  | { status: 'malformed' };

export function readGuestAccess(hash: string): GuestAccess {
  if (hash === '' || hash === '#') return { status: 'missing' };
  const match = /^#token=([^&]*)$/.exec(hash);
  if (!match || !isGuestAccessToken(match[1])) return { status: 'malformed' };
  return { status: 'ready', token: match[1] };
}

export function readGuestView(search: string): GuestView {
  const values = new URLSearchParams(search).getAll('view');
  return values.length === 1 && values[0] === 'guide' ? 'guide' : 'home';
}

export function buildGuestViewLocation(
  kind: GuestAccessKind,
  hash: string,
  view: GuestView,
): { pathname: string; search: string; hash: string } {
  return {
    pathname: kind === 'stay' ? '/guest/stay' : '/guest',
    search: view === 'guide' ? '?view=guide' : '',
    hash,
  };
}

const seoulDateTime = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function formatGuestStayTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? seoulDateTime.format(date) : '확인 필요';
}
