import type { AdminStayVehicleDto } from './admin-stay-vehicle.types';
import {
  invalidStayVehicleResponse,
  isStayVehicleId,
  isStayVehiclePlate,
  isStayVehicleText,
  isStayVehicleTimestamp,
  isStayVehicleVersion,
} from './admin-stay-vehicle-validation';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readStay(
  value: unknown,
  expectedStayId: string,
): AdminStayVehicleDto['stay'] {
  if (
    !isRecord(value) ||
    !isStayVehicleId(expectedStayId) ||
    !isStayVehicleId(value.id) ||
    value.id.toLowerCase() !== expectedStayId.toLowerCase() ||
    !isStayVehicleText(value.guestName) ||
    !isStayVehicleTimestamp(value.checkInAt) ||
    !isStayVehicleTimestamp(value.checkOutAt) ||
    Date.parse(value.checkInAt) >= Date.parse(value.checkOutAt) ||
    (value.status !== 'ACTIVE' && value.status !== 'CANCELLED') ||
    !isStayVehicleVersion(value.currentRevision) ||
    !isRecord(value.property) ||
    !isStayVehicleId(value.property.id) ||
    !isStayVehicleText(value.property.name) ||
    (value.property.region !== null &&
      !isStayVehicleText(value.property.region)) ||
    typeof value.property.isActive !== 'boolean' ||
    typeof value.property.vehicleRegistrationEnabled !== 'boolean'
  )
    throw invalidStayVehicleResponse();

  return {
    id: value.id.toLowerCase(),
    guestName: value.guestName,
    checkInAt: value.checkInAt,
    checkOutAt: value.checkOutAt,
    status: value.status,
    currentRevision: value.currentRevision,
    property: {
      id: value.property.id.toLowerCase(),
      name: value.property.name,
      region: value.property.region,
      isActive: value.property.isActive,
      vehicleRegistrationEnabled: value.property.vehicleRegistrationEnabled,
    },
  };
}

function readVehicle(
  value: unknown,
  currentRevision: number,
): AdminStayVehicleDto['vehicle'] {
  if (value === null) return null;
  if (
    !isRecord(value) ||
    (value.plateNumber !== null && !isStayVehiclePlate(value.plateNumber)) ||
    !isStayVehicleVersion(value.version) ||
    !isStayVehicleVersion(value.stayRevision) ||
    value.stayRevision > currentRevision ||
    !isStayVehicleTimestamp(value.createdAt) ||
    !isStayVehicleTimestamp(value.updatedAt) ||
    Date.parse(value.updatedAt) < Date.parse(value.createdAt)
  )
    throw invalidStayVehicleResponse();

  return {
    plateNumber: value.plateNumber,
    version: value.version,
    stayRevision: value.stayRevision,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

export function readAdminStayVehicle(
  value: unknown,
  expectedStayId: string,
): AdminStayVehicleDto {
  if (!isRecord(value) || typeof value.needsReview !== 'boolean')
    throw invalidStayVehicleResponse();
  const stay = readStay(value.stay, expectedStayId);
  const vehicle = readVehicle(value.vehicle, stay.currentRevision);
  const needsReview =
    vehicle !== null &&
    vehicle.plateNumber !== null &&
    vehicle.stayRevision !== stay.currentRevision;
  if (value.needsReview !== needsReview) throw invalidStayVehicleResponse();
  return { stay, vehicle, needsReview };
}
