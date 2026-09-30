import type {
  PropertyQrStatus,
  QrFlow,
  QrIssue,
  QrState,
} from './admin-property-qr.types';
import {
  invalidQrResponse,
  isPropertyQrId,
  isQrTimestamp,
} from './admin-property-qr-validation';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readQrState(value: unknown, propertyIsActive: boolean): QrState {
  if (
    !isRecord(value) ||
    typeof value.issued !== 'boolean' ||
    typeof value.enabled !== 'boolean' ||
    (value.rotatedAt !== null && !isQrTimestamp(value.rotatedAt)) ||
    value.issued !== (value.rotatedAt !== null) ||
    value.enabled !== (propertyIsActive && value.issued)
  )
    throw invalidQrResponse();
  return {
    issued: value.issued,
    enabled: value.enabled,
    rotatedAt: value.rotatedAt,
  };
}

export function readPropertyQrStatus(
  value: unknown,
  expectedId: string,
): PropertyQrStatus {
  if (
    !isRecord(value) ||
    !isPropertyQrId(expectedId) ||
    !isPropertyQrId(value.propertyId) ||
    value.propertyId.toLowerCase() !== expectedId.toLowerCase() ||
    typeof value.propertyIsActive !== 'boolean'
  )
    throw invalidQrResponse();
  return {
    propertyId: value.propertyId.toLowerCase(),
    propertyIsActive: value.propertyIsActive,
    guest: readQrState(value.guest, value.propertyIsActive),
    staff: readQrState(value.staff, value.propertyIsActive),
  };
}

function isIssuedUrl(
  value: unknown,
  flow: QrFlow,
  expectedFrontendOrigin: string,
): value is string {
  if (typeof value !== 'string') return false;
  try {
    const origin = new URL(expectedFrontendOrigin);
    const url = new URL(value);
    return (
      ['https:', 'http:'].includes(origin.protocol) &&
      origin.origin === expectedFrontendOrigin &&
      !origin.hostname.includes('*') &&
      url.origin === origin.origin &&
      url.protocol === origin.protocol &&
      url.username === '' &&
      url.password === '' &&
      url.pathname === (flow === 'GUEST' ? '/guest' : '/staff') &&
      url.search === '' &&
      /^#token=[A-Za-z0-9_-]{43}$/.test(url.hash) &&
      // Refuse normalized disguises, empty query markers and embedded controls.
      url.href === value &&
      value === `${origin.origin}${url.pathname}${url.hash}`
    );
  } catch {
    return false;
  }
}

export function readQrIssue(
  value: unknown,
  expectedId: string,
  expectedFlow: QrFlow,
  expectedRotatedAt: string | null,
  expectedFrontendOrigin = typeof window === 'undefined'
    ? ''
    : window.location.origin,
): QrIssue {
  if (
    !isRecord(value) ||
    !isPropertyQrId(expectedId) ||
    !isPropertyQrId(value.propertyId) ||
    value.propertyId.toLowerCase() !== expectedId.toLowerCase() ||
    (expectedFlow !== 'GUEST' && expectedFlow !== 'STAFF') ||
    value.flow !== expectedFlow ||
    !isQrTimestamp(value.rotatedAt) ||
    (expectedRotatedAt !== null &&
      (!isQrTimestamp(expectedRotatedAt) ||
        Date.parse(value.rotatedAt) <= Date.parse(expectedRotatedAt))) ||
    !isIssuedUrl(value.url, expectedFlow, expectedFrontendOrigin)
  )
    throw invalidQrResponse();
  return {
    propertyId: value.propertyId.toLowerCase(),
    flow: expectedFlow,
    url: value.url,
    rotatedAt: value.rotatedAt,
  };
}
