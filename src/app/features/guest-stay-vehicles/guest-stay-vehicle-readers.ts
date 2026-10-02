import {
  isGuestId,
  isGuestText,
  isGuestTimestamp,
} from '../guest-entry/guest-entry-validation';
import type {
  GuestStayVehicleDto,
  GuestStayVehicleScope,
  SaveGuestStayVehicleInput,
} from './guest-stay-vehicle.types';
import {
  invalidGuestVehicleResponse,
  isGuestVehicleVersion,
  normalizeGuestVehiclePlate,
  prepareGuestVehicleInput,
  validateGuestVehiclePlate,
} from './guest-stay-vehicle-validation';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readGuestStayVehicle(
  value: unknown,
  scope: GuestStayVehicleScope,
): GuestStayVehicleDto {
  if (
    !scope ||
    !isGuestId(scope.stayId) ||
    !isGuestId(scope.propertyId) ||
    !isRecord(value) ||
    !isGuestId(value.stayId) ||
    value.stayId.toLowerCase() !== scope.stayId.toLowerCase() ||
    !isRecord(value.property) ||
    !isGuestId(value.property.id) ||
    value.property.id.toLowerCase() !== scope.propertyId.toLowerCase() ||
    !isGuestText(value.property.name, 100) ||
    (value.property.region !== null &&
      !isGuestText(value.property.region, 100)) ||
    typeof value.enabled !== 'boolean' ||
    !isGuestVehicleVersion(value.version) ||
    (value.plateNumber !== null &&
      (typeof value.plateNumber !== 'string' ||
        validateGuestVehiclePlate(value.plateNumber) !== null ||
        normalizeGuestVehiclePlate(value.plateNumber) !== value.plateNumber)) ||
    typeof value.needsConfirmation !== 'boolean' ||
    (value.updatedAt !== null && !isGuestTimestamp(value.updatedAt)) ||
    ((!value.enabled || value.version === 0) &&
      (value.plateNumber !== null ||
        value.updatedAt !== null ||
        value.needsConfirmation)) ||
    (value.needsConfirmation &&
      (value.plateNumber !== null || value.updatedAt !== null)) ||
    (value.plateNumber !== null && value.updatedAt === null)
  )
    throw invalidGuestVehicleResponse();

  // A positive version with null plate/timestamp and no confirmation is valid:
  // a cleared row from an older stay revision remains hidden from this guest.
  return {
    stayId: value.stayId.toLowerCase(),
    property: {
      id: value.property.id.toLowerCase(),
      name: value.property.name,
      region: value.property.region,
    },
    enabled: value.enabled,
    version: value.version,
    plateNumber: value.plateNumber,
    needsConfirmation: value.needsConfirmation,
    updatedAt: value.updatedAt,
  };
}

export function readSavedGuestStayVehicle(
  value: unknown,
  scope: GuestStayVehicleScope,
  input: SaveGuestStayVehicleInput,
): GuestStayVehicleDto {
  const expected = prepareGuestVehicleInput(input);
  const saved = readGuestStayVehicle(value, scope);
  if (
    !saved.enabled ||
    saved.needsConfirmation ||
    saved.version !== expected.expectedVersion + 1 ||
    saved.plateNumber !== expected.plateNumber ||
    saved.updatedAt === null
  )
    throw invalidGuestVehicleResponse();
  return saved;
}
