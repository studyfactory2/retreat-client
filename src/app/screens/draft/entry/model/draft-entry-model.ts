import { isStaffQrToken } from '../../../../features/staff-entry/staff-entry-validation';

export function readPrivateDraftToken(hash: string): string | null {
  const match = /^#token=([A-Za-z0-9_-]+)$/.exec(hash);
  return match && hash === `#token=${match[1]}` && isStaffQrToken(match[1])
    ? match[1]
    : null;
}
