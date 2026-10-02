import { ApiRequestError } from '../../../../core/api/api-error';
import type { GuestStayContextDto } from '../../../../features/guest-entry/guest-entry.types';
import type { GuestStayVehicleDto } from '../../../../features/guest-stay-vehicles/guest-stay-vehicle.types';
import { normalizeGuestVehiclePlate } from '../../../../features/guest-stay-vehicles/guest-stay-vehicle-validation';

export type GuestVehiclePhase =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'saving'
  | 'review'
  | 'blocked'
  | 'error'
  | 'disabled'
  | 'denied';
export interface GuestVehicleState {
  phase: GuestVehiclePhase;
  snapshot: GuestStayVehicleDto | null;
  context: GuestStayContextDto | null;
  input: string;
  baselinePlate: string;
  reviewRequired: boolean;
  uncertain: boolean;
  expiresAt: string | null;
  error: string;
  message: string;
}

export function createGuestVehicleState(): GuestVehicleState {
  return {
    phase: 'idle',
    snapshot: null,
    context: null,
    input: '',
    baselinePlate: '',
    reviewRequired: false,
    uncertain: false,
    expiresAt: null,
    error: '',
    message: '',
  };
}

export function guestVehicleDirty(state: GuestVehicleState): boolean {
  return normalizeGuestVehiclePlate(state.input) !== state.baselinePlate;
}

export function sameGuestVehicleScope(
  left: GuestStayContextDto,
  right: GuestStayContextDto,
): boolean {
  return (
    left.stayId === right.stayId &&
    left.property.id === right.property.id &&
    left.expiresAt === right.expiresAt &&
    left.guestName === right.guestName &&
    left.checkInAt === right.checkInAt &&
    left.checkOutAt === right.checkOutAt
  );
}

export function sameGuestVehicleSnapshot(
  left: GuestStayVehicleDto,
  right: GuestStayVehicleDto,
): boolean {
  return (
    left.version === right.version &&
    left.plateNumber === right.plateNumber &&
    left.updatedAt === right.updatedAt &&
    left.needsConfirmation === right.needsConfirmation &&
    left.enabled === right.enabled
  );
}

export function guestVehicleFailure(error: unknown): {
  kind: 'denied' | 'disabled' | 'blocked' | 'recoverable';
  uncertain: boolean;
  message: string;
} {
  const failure = error instanceof ApiRequestError ? error : null;
  if (
    failure?.status === 401 ||
    failure?.status === 403 ||
    failure?.code === 'INVALID_STAY_ACCESS'
  )
    return {
      kind: 'denied',
      uncertain: false,
      message:
        '이용 링크를 사용할 수 없습니다. 관리자에게 새 링크를 요청해 주세요.',
    };
  if (failure?.code === 'VEHICLE_REGISTRATION_DISABLED')
    return {
      kind: 'disabled',
      uncertain: false,
      message: '이 휴양소는 현재 차량번호를 수집하지 않습니다.',
    };
  const uncertain =
    failure === null ||
    failure.status === null ||
    failure.status < 400 ||
    failure.status === 408 ||
    failure.status >= 500;
  if (uncertain)
    return {
      kind: 'blocked',
      uncertain: true,
      message:
        '저장 결과를 확인하지 못했습니다. 서버에는 반영되었을 수 있습니다. 최신 내용을 불러와 확인한 뒤 계속해 주세요. 자동으로 다시 저장하지 않습니다.',
    };
  if (failure.status === 409 || failure.status === 404)
    return {
      kind: 'blocked',
      uncertain: false,
      message:
        '차량 정보가 변경되었습니다. 최신 내용을 불러와 확인한 뒤 계속해 주세요.',
    };
  return {
    kind: 'recoverable',
    uncertain: false,
    message:
      failure.status === 429
        ? '요청이 많습니다. 잠시 후 다시 시도해 주세요.'
        : failure.message,
  };
}
