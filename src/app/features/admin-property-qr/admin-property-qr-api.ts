import { apiRequest } from '../../core/api/api-client';
import { appConfig } from '../../core/config/environment';
import { readPropertyQrStatus, readQrIssue } from './admin-property-qr-readers';
import type {
  PropertyQrStatus,
  QrFlow,
  QrIssue,
} from './admin-property-qr.types';
import {
  requirePropertyQrId,
  requireQrRotationInput,
} from './admin-property-qr-validation';

export async function getAdminPropertyQr(
  id: string,
  token: string,
  signal?: AbortSignal,
): Promise<PropertyQrStatus> {
  const propertyId = requirePropertyQrId(id);
  return readPropertyQrStatus(
    await apiRequest<unknown>(`/admin/properties/${propertyId}/qr`, {
      token,
      signal,
    }),
    propertyId,
  );
}

export async function rotateAdminPropertyQr(
  id: string,
  flow: QrFlow,
  expectedRotatedAt: string | null,
  token: string,
  signal?: AbortSignal,
): Promise<QrIssue> {
  const propertyId = requirePropertyQrId(id);
  requireQrRotationInput(flow, expectedRotatedAt);
  return readQrIssue(
    await apiRequest<unknown>(
      `/admin/properties/${propertyId}/qr/${flow.toLowerCase()}/rotate`,
      { method: 'POST', token, signal, body: { expectedRotatedAt } },
    ),
    propertyId,
    flow,
    expectedRotatedAt,
    appConfig.frontendOrigin,
  );
}
