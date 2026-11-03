import { apiRequest } from '../../core/api/api-client';
import { ApiRequestError } from '../../core/api/api-error';
import type {
  AdminStayAccessDto,
  SaveStayAccessInput,
  StayCodeMethod,
  StayCodeVersions,
} from './admin-stay-access.types';
import {
  invalidStayAccess,
  isStayAccessVersion,
  readStayAccess,
  readStayAccessReveal,
  stayAccessId,
} from './admin-stay-access-readers';

function path(id: string): string {
  if (!stayAccessId(id))
    throw new ApiRequestError(
      '이용 일정을 확인해 주세요.',
      400,
      'INVALID_STAY_ID',
    );
  return `/admin/stays/${id.toLowerCase()}/access-code`;
}
export function stayAccessVersions(data: AdminStayAccessDto): StayCodeVersions {
  return {
    expectedStayRevision: data.stay.currentRevision,
    expectedSettingsVersion: data.propertySettings.version,
    expectedCodeVersion: data.code?.version ?? 0,
  };
}
function checkVersions(input: StayCodeVersions): void {
  if (
    !isStayAccessVersion(input.expectedStayRevision) ||
    input.expectedStayRevision === 0 ||
    !isStayAccessVersion(input.expectedSettingsVersion) ||
    !isStayAccessVersion(input.expectedCodeVersion)
  )
    throw invalidStayAccess();
}
export async function getStayAccess(
  id: string,
  token: string,
  signal?: AbortSignal,
): Promise<AdminStayAccessDto> {
  return readStayAccess(
    await apiRequest<unknown>(path(id), { token, signal }),
    id,
  );
}
export async function saveStayAccess(
  id: string,
  input: SaveStayAccessInput,
  token: string,
  signal?: AbortSignal,
): Promise<AdminStayAccessDto> {
  checkVersions(input);
  if (
    input.expectedCodeVersion >= 2147483647 ||
    !['PREPARE', 'REPLACE', 'CONFIRM'].includes(input.action) ||
    (input.action !== 'CONFIRM' &&
      !['AUTO', 'PHONE_LAST6', 'FIXED'].includes(input.method))
  )
    throw invalidStayAccess();
  const body: Record<string, string | number> = {
    expectedStayRevision: input.expectedStayRevision,
    expectedSettingsVersion: input.expectedSettingsVersion,
    expectedCodeVersion: input.expectedCodeVersion,
    action: input.action,
  };
  if (input.action !== 'CONFIRM') body.method = input.method;
  const data = readStayAccess(
    await apiRequest<unknown>(path(id), {
      method: 'POST',
      body,
      token,
      signal,
    }),
    id,
  );
  if (
    !data.code ||
    data.code.version !== input.expectedCodeVersion + 1 ||
    data.stay.currentRevision !== input.expectedStayRevision ||
    data.propertySettings.version !== input.expectedSettingsVersion ||
    (input.action !== 'CONFIRM' && data.code.method !== input.method)
  )
    throw invalidStayAccess();
  return data;
}
export async function revealStayAccess(
  id: string,
  versions: StayCodeVersions,
  method: StayCodeMethod,
  token: string,
  signal?: AbortSignal,
): Promise<string> {
  checkVersions(versions);
  if (versions.expectedCodeVersion === 0) throw invalidStayAccess();
  return readStayAccessReveal(
    await apiRequest<unknown>(`${path(id)}/reveal`, {
      method: 'POST',
      body: { ...versions },
      token,
      signal,
    }),
    id,
    versions,
    method,
  );
}
