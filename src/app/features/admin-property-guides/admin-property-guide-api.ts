import { apiRequest } from '../../core/api/api-client';
import type {
  AdminPropertyGuideDto,
  SaveAdminPropertyGuideInput,
} from './admin-property-guide.types';
import {
  readAdminPropertyGuide,
  verifySavedPropertyGuide,
} from './admin-property-guide-readers';
import {
  prepareSaveAdminPropertyGuide,
  requireGuidePropertyId,
} from './admin-property-guide-validation';

export async function getAdminPropertyGuide(
  id: string,
  token: string,
  signal?: AbortSignal,
): Promise<AdminPropertyGuideDto> {
  const propertyId = requireGuidePropertyId(id);
  return readAdminPropertyGuide(
    await apiRequest<unknown>(`/admin/properties/${propertyId}/guide`, {
      token,
      signal,
    }),
    propertyId,
  );
}

export async function saveAdminPropertyGuide(
  id: string,
  input: SaveAdminPropertyGuideInput,
  token: string,
  signal?: AbortSignal,
): Promise<AdminPropertyGuideDto> {
  const propertyId = requireGuidePropertyId(id);
  const body = prepareSaveAdminPropertyGuide(input);
  const response = readAdminPropertyGuide(
    await apiRequest<unknown>(`/admin/properties/${propertyId}/guide`, {
      method: 'POST',
      token,
      signal,
      body: { ...body },
    }),
    propertyId,
  );
  verifySavedPropertyGuide(response, body);
  return response;
}
