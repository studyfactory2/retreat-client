import { apiRequest } from '../../core/api/api-client';
import type { StaffQrContextDto } from './staff-entry.types';
import { readStaffQrContext } from './staff-entry-readers';
import { requireStaffQrToken } from './staff-entry-validation';

export async function getStaffQrContext(
  token: string,
  signal?: AbortSignal,
): Promise<StaffQrContextDto> {
  requireStaffQrToken(token);
  return readStaffQrContext(
    await apiRequest<unknown>('/qr/staff', { token, signal }),
  );
}
