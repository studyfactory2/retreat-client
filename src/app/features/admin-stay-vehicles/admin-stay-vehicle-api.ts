import { apiRequest } from '../../core/api/api-client';
import { readAdminStayVehicle } from './admin-stay-vehicle-readers';
import type { AdminStayVehicleDto } from './admin-stay-vehicle.types';
import { requireStayVehicleId } from './admin-stay-vehicle-validation';

export async function getAdminStayVehicle(
  id: string,
  token: string,
  signal?: AbortSignal,
): Promise<AdminStayVehicleDto> {
  const stayId = requireStayVehicleId(id);
  return readAdminStayVehicle(
    await apiRequest<unknown>(`/admin/stays/${stayId}/vehicle`, {
      token,
      signal,
    }),
    stayId,
  );
}
