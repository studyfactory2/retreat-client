import { ApiRequestError } from '../../core/api/api-error';
import { isStayId } from '../admin-stays/admin-stays-validation';

export function isStayVehicleId(value: unknown): value is string {
  return isStayId(value);
}

export function requireStayVehicleId(value: unknown): string {
  if (!isStayVehicleId(value))
    throw new ApiRequestError(
      '이용 일정 정보를 확인해 주세요.',
      400,
      'INVALID_STAY_ID',
    );
  return value.toLowerCase();
}

export function isStayVehicleVersion(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 2_147_483_647
  );
}

export function isStayVehicleTimestamp(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
  )
    return false;
  const timestamp = Date.parse(value);
  return (
    Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value
  );
}

export function isStayVehicleText(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value === value.trim() &&
    value.length > 0 &&
    Array.from(value).length <= 100
  );
}

export function isStayVehiclePlate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  // The guest API persists normalized bounded text, not an official licence
  // classification. Accept its full alphabet, including uncommon plate forms.
  return (
    value === value.normalize('NFC').trim().replace(/ /g, '').toUpperCase() &&
    value.length >= 3 &&
    value.length <= 20 &&
    /^(?=.*[0-9])[0-9A-Z가-힣-]+$/u.test(value)
  );
}

export function invalidStayVehicleResponse(): ApiRequestError {
  return new ApiRequestError(
    '차량 정보 응답을 확인할 수 없습니다. 최신 상태를 다시 불러와 주세요.',
    200,
    'INVALID_STAY_VEHICLE_RESPONSE',
  );
}
