import { isStaffQrToken } from '../../../../features/staff-entry/staff-entry-validation';

export type StaffAccess =
  | { status: 'ready'; token: string }
  | { status: 'missing' }
  | { status: 'malformed' };

export function readStaffAccess(hash: string): StaffAccess {
  if (hash === '' || hash === '#') return { status: 'missing' };
  const match = /^#token=([^&]*)$/.exec(hash);
  if (!match || !isStaffQrToken(match[1])) return { status: 'malformed' };
  return { status: 'ready', token: match[1] };
}
