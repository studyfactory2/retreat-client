import { apiRequest } from '../../core/api/api-client';
import { ApiRequestError } from '../../core/api/api-error';
import type {
  AccessCodeKind,
  AdminPropertyAccessDto,
  RevealedAccessCode,
  SavePropertyAccessInput,
} from './admin-property-access.types';

export const MAX_ACCESS_VERSION = 2147483647;
export const isAccessCode = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9*#]{1,32}$/.test(value);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const isVersion = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= MAX_ACCESS_VERSION;
const invalid = () =>
  new ApiRequestError(
    '저장된 설정을 확인하지 못했습니다. 다시 불러와 주세요.',
    200,
    'INVALID_ACCESS_SETTINGS_RESPONSE',
  );

function propertyPath(id: string): string {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    )
  )
    throw new ApiRequestError(
      '휴양소 정보를 확인해 주세요.',
      400,
      'INVALID_PROPERTY_ID',
    );
  return `/admin/properties/${id.toLowerCase()}/access-settings`;
}

export function readPropertyAccess(
  value: unknown,
  propertyId: string,
): AdminPropertyAccessDto {
  if (
    !isRecord(value) ||
    !isRecord(value.property) ||
    !isRecord(value.settings)
  )
    throw invalid();
  const { property, settings } = value;
  if (
    property.id !== propertyId.toLowerCase() ||
    typeof property.name !== 'string' ||
    !property.name ||
    property.name.length > 100 ||
    (property.region !== null && typeof property.region !== 'string') ||
    typeof property.isActive !== 'boolean' ||
    !isVersion(settings.version) ||
    ![null, 'FIXED', 'ROTATING'].includes(settings.roomMode as string | null) ||
    typeof settings.hasEntranceCode !== 'boolean' ||
    typeof settings.hasFixedRoomCode !== 'boolean' ||
    typeof settings.hasVacancyCode !== 'boolean' ||
    (settings.version === 0
      ? settings.roomMode !== null ||
        settings.updatedAt !== null ||
        settings.hasEntranceCode ||
        settings.hasFixedRoomCode ||
        settings.hasVacancyCode
      : settings.roomMode === null ||
        typeof settings.updatedAt !== 'string' ||
        !Number.isFinite(Date.parse(settings.updatedAt))) ||
    (settings.roomMode === 'FIXED' && !settings.hasFixedRoomCode)
  )
    throw invalid();
  return {
    property: {
      id: propertyId.toLowerCase(),
      name: property.name,
      region: property.region as string | null,
      isActive: property.isActive,
    },
    settings: {
      version: settings.version,
      roomMode:
        settings.roomMode as AdminPropertyAccessDto['settings']['roomMode'],
      hasEntranceCode: settings.hasEntranceCode,
      hasFixedRoomCode: settings.hasFixedRoomCode,
      hasVacancyCode: settings.hasVacancyCode,
      updatedAt: settings.updatedAt as string | null,
    },
  };
}

export async function getPropertyAccess(
  id: string,
  token: string,
  signal?: AbortSignal,
): Promise<AdminPropertyAccessDto> {
  return readPropertyAccess(
    await apiRequest<unknown>(propertyPath(id), { token, signal }),
    id,
  );
}

export async function savePropertyAccess(
  id: string,
  input: SavePropertyAccessInput,
  token: string,
  signal?: AbortSignal,
): Promise<AdminPropertyAccessDto> {
  if (
    !isVersion(input.expectedVersion) ||
    input.expectedVersion >= MAX_ACCESS_VERSION ||
    !['FIXED', 'ROTATING'].includes(input.roomMode)
  )
    throw invalid();
  for (const key of ['entranceCode', 'fixedRoomCode', 'vacancyCode'] as const) {
    if (
      input[key] !== undefined &&
      input[key] !== null &&
      !isAccessCode(input[key])
    )
      throw new ApiRequestError(
        '비밀번호는 숫자, * 또는 #으로 1~32자 입력해 주세요.',
        400,
        'INVALID_ACCESS_CODE',
      );
  }
  const result = readPropertyAccess(
    await apiRequest<unknown>(propertyPath(id), {
      method: 'POST',
      body: { ...input },
      token,
      signal,
    }),
    id,
  );
  if (
    result.settings.version !== input.expectedVersion + 1 ||
    result.settings.roomMode !== input.roomMode
  )
    throw invalid();
  for (const [field, flag] of [
    ['entranceCode', 'hasEntranceCode'],
    ['fixedRoomCode', 'hasFixedRoomCode'],
    ['vacancyCode', 'hasVacancyCode'],
  ] as const) {
    if (
      input[field] !== undefined &&
      result.settings[flag] !== (input[field] !== null)
    )
      throw invalid();
  }
  return result;
}

export async function revealPropertyAccessCode(
  id: string,
  kind: AccessCodeKind,
  expectedVersion: number,
  token: string,
  signal?: AbortSignal,
): Promise<RevealedAccessCode> {
  if (
    !isVersion(expectedVersion) ||
    !['ENTRANCE', 'FIXED_ROOM', 'VACANCY'].includes(kind)
  )
    throw invalid();
  const result = await apiRequest<unknown>(`${propertyPath(id)}/reveal`, {
    method: 'POST',
    body: { kind, expectedVersion },
    token,
    signal,
  });
  if (
    !isRecord(result) ||
    result.kind !== kind ||
    result.version !== expectedVersion ||
    !isAccessCode(result.code)
  )
    throw invalid();
  return { kind, version: expectedVersion, code: result.code };
}
