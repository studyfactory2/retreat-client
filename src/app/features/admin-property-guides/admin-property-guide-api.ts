import {
  GUIDE_PDF_MAX_BYTES,
  requireGuidePdfVersion,
  validateGuidePdfBlob,
} from '../property-guide/guide-pdf';
import { apiDownloadWithHeaders, apiRequest } from '../../core/api/api-client';
import type {
  AdminPropertyGuideDto,
  SaveAdminPropertyGuideInput,
  SaveAdminPropertyGuidePdfInput,
} from './admin-property-guide.types';
import {
  readAdminPropertyGuide,
  verifySavedPropertyGuide,
} from './admin-property-guide-readers';
import {
  prepareSaveAdminPropertyGuide,
  prepareSaveAdminPropertyGuidePdf,
  invalidGuideResponse,
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

export async function saveAdminPropertyGuidePdf(
  id: string,
  input: SaveAdminPropertyGuidePdfInput,
  token: string,
  signal?: AbortSignal,
): Promise<AdminPropertyGuideDto> {
  const propertyId = requireGuidePropertyId(id);
  const fields = prepareSaveAdminPropertyGuidePdf(input);
  if (fields.file) await validateGuidePdfBlob(fields.file);
  const body = new FormData();
  body.set('expectedVersion', String(fields.expectedVersion));
  body.set('title', fields.title);
  body.set('content', fields.content);
  body.set('isPublished', String(fields.isPublished));
  if (fields.file) body.set('file', fields.file);
  const response = readAdminPropertyGuide(
    await apiRequest<unknown>(`/admin/properties/${propertyId}/guide/pdf`, {
      method: 'POST',
      token,
      signal,
      body,
      timeoutMs: 90_000,
    }),
    propertyId,
  );
  if (
    !response.guide ||
    response.guide.type !== 'PDF' ||
    !response.guide.pdf ||
    response.guide.version !== fields.expectedVersion + 1 ||
    response.guide.title !== fields.title ||
    response.guide.content !== fields.content ||
    response.guide.isPublished !== fields.isPublished ||
    (fields.file && response.guide.pdf.sizeBytes !== fields.file.size)
  )
    throw invalidGuideResponse();
  return response;
}

export async function getAdminPropertyGuidePdf(
  id: string,
  version: number,
  token: string,
  signal?: AbortSignal,
): Promise<Blob> {
  const propertyId = requireGuidePropertyId(id);
  const { blob } = await apiDownloadWithHeaders(
    `/admin/properties/${propertyId}/guide/pdf?version=${requireGuidePdfVersion(version)}`,
    { token, signal, timeoutMs: 90_000 },
    GUIDE_PDF_MAX_BYTES,
  );
  return validateGuidePdfBlob(blob);
}
