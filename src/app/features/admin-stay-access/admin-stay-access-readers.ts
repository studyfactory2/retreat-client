import { ApiRequestError } from '../../core/api/api-error';
import type {
  AdminStayAccessDto,
  StayCodeMethod,
  StayCodeVersions,
} from './admin-stay-access.types';

const methods = ['AUTO', 'PHONE_LAST6', 'FIXED'];
const reasons = [
  'PHONE_CHANGED',
  'GUEST_CHANGED',
  'RESTORED',
  'PROPERTY_MODE_CHANGED',
  'FIXED_CODE_CHANGED',
  'NEIGHBOR_CODE_CONFLICT',
  'SOURCE_UNAVAILABLE',
];
const blocks = [
  'CANCELLED',
  'ENDED',
  'PROPERTY_INACTIVE',
  'PROPERTY_UNCONFIGURED',
  'FIXED_CODE_MISSING',
];
const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
export const isStayAccessVersion = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= 2147483647;
const date = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length <= 40 &&
  Number.isFinite(Date.parse(value));
export const stayAccessId = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
    value,
  );
export const invalidStayAccess = () =>
  new ApiRequestError(
    '예약 비밀번호 상태를 확인하지 못했습니다. 최신 상태를 불러와 주세요.',
    200,
    'INVALID_STAY_ACCESS_RESPONSE',
  );

export function readStayAccess(
  value: unknown,
  stayId: string,
): AdminStayAccessDto {
  if (!record(value) || !record(value.stay) || !record(value.propertySettings))
    throw invalidStayAccess();
  const {
    stay,
    propertySettings: settings,
    code,
    history,
    reviewReasons,
  } = value;
  if (
    stay.id !== stayId.toLowerCase() ||
    !stayAccessId(stay.propertyId) ||
    !isStayAccessVersion(stay.currentRevision) ||
    !['ACTIVE', 'CANCELLED'].includes(stay.status as string) ||
    !date(stay.checkOutAt) ||
    typeof stay.propertyIsActive !== 'boolean' ||
    !isStayAccessVersion(settings.version) ||
    ![null, 'FIXED', 'ROTATING'].includes(settings.roomMode as string | null) ||
    typeof settings.hasFixedRoomCode !== 'boolean' ||
    (settings.version === 0) !== (settings.roomMode === null) ||
    !['UNSET', 'PREPARED', 'REVIEW_REQUIRED'].includes(value.state as string) ||
    (value.blockedReason !== null &&
      !blocks.includes(value.blockedReason as string)) ||
    typeof value.phoneEligible !== 'boolean' ||
    typeof value.canConfirm !== 'boolean' ||
    !Array.isArray(reviewReasons) ||
    reviewReasons.length > reasons.length ||
    !reviewReasons.every(
      (reason) => typeof reason === 'string' && reasons.includes(reason),
    ) ||
    new Set(reviewReasons).size !== reviewReasons.length ||
    !Array.isArray(history) ||
    history.length > 5
  )
    throw invalidStayAccess();
  if (
    code !== null &&
    (!record(code) ||
      !isStayAccessVersion(code.version) ||
      code.version === 0 ||
      !methods.includes(code.method as string) ||
      !date(code.preparedAt) ||
      !date(code.updatedAt) ||
      !isStayAccessVersion(code.sourceStayRevision) ||
      code.sourceStayRevision === 0 ||
      code.sourceStayRevision > stay.currentRevision ||
      !isStayAccessVersion(code.sourceSettingsVersion) ||
      code.sourceSettingsVersion === 0 ||
      code.sourceSettingsVersion > settings.version ||
      (code.phoneMatchesCurrent !== null &&
        typeof code.phoneMatchesCurrent !== 'boolean') ||
      (code.method !== 'PHONE_LAST6' && code.phoneMatchesCurrent !== null))
  )
    throw invalidStayAccess();
  if (
    (value.state === 'UNSET') !== (code === null) ||
    (value.state === 'REVIEW_REQUIRED') !== reviewReasons.length > 0 ||
    (value.canConfirm &&
      (code === null ||
        value.blockedReason !== null ||
        value.state !== 'REVIEW_REQUIRED'))
  )
    throw invalidStayAccess();
  const parsedHistory = history.map((entry) => {
    if (
      !record(entry) ||
      !isStayAccessVersion(entry.version) ||
      entry.version === 0 ||
      code === null ||
      !record(code) ||
      entry.version > (code.version as number) ||
      !['PREPARED', 'REPLACED', 'CONFIRMED'].includes(entry.action as string) ||
      !methods.includes(entry.method as string) ||
      typeof entry.actorName !== 'string' ||
      !entry.actorName ||
      entry.actorName.length > 100 ||
      !date(entry.createdAt)
    )
      throw invalidStayAccess();
    return {
      version: entry.version,
      action: entry.action as AdminStayAccessDto['history'][number]['action'],
      method: entry.method as StayCodeMethod,
      actorName: entry.actorName,
      createdAt: entry.createdAt,
    };
  });
  return {
    stay: {
      id: stayId.toLowerCase(),
      propertyId: stay.propertyId,
      currentRevision: stay.currentRevision,
      status: stay.status as 'ACTIVE' | 'CANCELLED',
      checkOutAt: stay.checkOutAt,
      propertyIsActive: stay.propertyIsActive,
    },
    propertySettings: {
      version: settings.version,
      roomMode: settings.roomMode as 'FIXED' | 'ROTATING' | null,
      hasFixedRoomCode: settings.hasFixedRoomCode,
    },
    state: value.state as AdminStayAccessDto['state'],
    blockedReason: value.blockedReason as AdminStayAccessDto['blockedReason'],
    phoneEligible: value.phoneEligible,
    reviewReasons: reviewReasons as AdminStayAccessDto['reviewReasons'],
    code:
      code === null
        ? null
        : {
            version: code.version as number,
            method: code.method as StayCodeMethod,
            preparedAt: code.preparedAt as string,
            updatedAt: code.updatedAt as string,
            sourceStayRevision: code.sourceStayRevision as number,
            sourceSettingsVersion: code.sourceSettingsVersion as number,
            phoneMatchesCurrent: code.phoneMatchesCurrent as boolean | null,
          },
    canConfirm: value.canConfirm,
    history: parsedHistory,
  };
}

export function readStayAccessReveal(
  value: unknown,
  id: string,
  versions: StayCodeVersions,
  method: StayCodeMethod,
): string {
  if (
    !record(value) ||
    value.stayId !== id.toLowerCase() ||
    value.version !== versions.expectedCodeVersion ||
    typeof value.code !== 'string' ||
    !(method === 'FIXED' ? /^[0-9*#]{1,32}$/ : /^[0-9]{6}$/).test(value.code)
  )
    throw invalidStayAccess();
  return value.code;
}
