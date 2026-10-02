import { ApiRequestError } from '../../core/api/api-error';
import { isGuestId } from '../guest-entry/guest-entry-validation';
import type {
  GuestStayVehicleScope,
  SaveGuestStayVehicleInput,
} from './guest-stay-vehicle.types';

export const GUEST_VEHICLE_MAX_VERSION = 2_147_483_647;

export function isGuestVehicleVersion(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= GUEST_VEHICLE_MAX_VERSION
  );
}

export function normalizeGuestVehiclePlate(value: string): string {
  return value.normalize('NFC').trim().replace(/ /g, '').toUpperCase();
}

export function validateGuestVehiclePlate(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== 'string') return '차량번호를 입력해 주세요.';
  const plate = normalizeGuestVehiclePlate(value);
  if (plate.length < 3 || plate.length > 20)
    return '차량번호는 공백을 제외하고 3~20자로 입력해 주세요.';
  if (!/^(?=.*[0-9])[0-9A-Z가-힣-]+$/u.test(plate))
    return '차량번호는 숫자를 포함한 한글, 영문, 숫자, 하이픈으로 입력해 주세요.';
  return null;
}

export function invalidGuestVehicleInput(
  message = '차량 정보를 확인해 주세요.',
  field?: 'expectedVersion' | 'plateNumber',
): ApiRequestError {
  return new ApiRequestError(
    message,
    400,
    'INVALID_GUEST_VEHICLE_INPUT',
    field ? [{ field, messages: [message] }] : [],
  );
}

export function requireGuestVehicleScope(
  scope: GuestStayVehicleScope,
): GuestStayVehicleScope {
  if (!scope || !isGuestId(scope.stayId) || !isGuestId(scope.propertyId))
    throw invalidGuestVehicleInput('이용 일정 정보를 다시 확인해 주세요.');
  return {
    stayId: scope.stayId.toLowerCase(),
    propertyId: scope.propertyId.toLowerCase(),
  };
}

export function prepareGuestVehicleInput(
  input: SaveGuestStayVehicleInput,
): SaveGuestStayVehicleInput {
  if (
    !input ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    Object.keys(input).some(
      (key) => key !== 'expectedVersion' && key !== 'plateNumber',
    )
  )
    throw invalidGuestVehicleInput();
  if (
    !isGuestVehicleVersion(input.expectedVersion) ||
    input.expectedVersion === GUEST_VEHICLE_MAX_VERSION
  )
    throw invalidGuestVehicleInput(
      '최신 차량 정보를 다시 확인해 주세요.',
      'expectedVersion',
    );
  const plateError = validateGuestVehiclePlate(input.plateNumber);
  if (plateError) throw invalidGuestVehicleInput(plateError, 'plateNumber');
  return {
    expectedVersion: input.expectedVersion,
    plateNumber:
      input.plateNumber === null
        ? null
        : normalizeGuestVehiclePlate(input.plateNumber),
  };
}

export function invalidGuestVehicleResponse(): ApiRequestError {
  // A malformed POST success may follow a committed save. The caller must
  // reconcile with a fresh GET instead of automatically repeating the write.
  return new ApiRequestError(
    '차량 정보 응답을 확인할 수 없습니다. 최신 정보를 다시 불러와 주세요.',
    200,
    'INVALID_GUEST_VEHICLE_RESPONSE',
  );
}
