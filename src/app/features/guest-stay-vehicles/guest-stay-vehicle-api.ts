import { apiRequest } from '../../core/api/api-client';
import { requireGuestAccessInput } from '../guest-entry/guest-entry-validation';
import {
  readGuestStayVehicle,
  readSavedGuestStayVehicle,
} from './guest-stay-vehicle-readers';
import type {
  GuestStayVehicleDto,
  GuestStayVehicleScope,
  SaveGuestStayVehicleInput,
} from './guest-stay-vehicle.types';
import {
  prepareGuestVehicleInput,
  requireGuestVehicleScope,
} from './guest-stay-vehicle-validation';

export async function getGuestStayVehicle(
  scope: GuestStayVehicleScope,
  token: string,
  signal?: AbortSignal,
): Promise<GuestStayVehicleDto> {
  requireGuestAccessInput('stay', token);
  const expectedScope = requireGuestVehicleScope(scope);
  return readGuestStayVehicle(
    await apiRequest<unknown>('/guest/stays/vehicle', { token, signal }),
    expectedScope,
  );
}

export async function saveGuestStayVehicle(
  scope: GuestStayVehicleScope,
  input: SaveGuestStayVehicleInput,
  token: string,
  signal?: AbortSignal,
): Promise<GuestStayVehicleDto> {
  requireGuestAccessInput('stay', token);
  const expectedScope = requireGuestVehicleScope(scope);
  const prepared = prepareGuestVehicleInput(input);
  return readSavedGuestStayVehicle(
    await apiRequest<unknown>('/guest/stays/vehicle', {
      method: 'POST',
      token,
      signal,
      body: {
        expectedVersion: prepared.expectedVersion,
        plateNumber: prepared.plateNumber,
      },
    }),
    expectedScope,
    prepared,
  );
}
