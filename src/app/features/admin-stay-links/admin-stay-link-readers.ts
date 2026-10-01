import type {
  AdminStayLinkIssue,
  AdminStayLinkStatus,
} from './admin-stay-link.types';
import {
  invalidStayLinkResponse,
  isStayLinkId,
  isStayLinkRevision,
  isStayLinkTimestamp,
  isStayLinkVersion,
  STAY_LINK_GRACE_MS,
  STAY_LINK_MAX_VERSION,
} from './admin-stay-link-validation';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readAdminStayLinkStatus(
  value: unknown,
  expectedId: string,
): AdminStayLinkStatus {
  if (
    !isRecord(value) ||
    !isStayLinkId(expectedId) ||
    !isStayLinkId(value.stayId) ||
    value.stayId.toLowerCase() !== expectedId.toLowerCase() ||
    typeof value.issued !== 'boolean' ||
    typeof value.enabled !== 'boolean' ||
    !isStayLinkVersion(value.version) ||
    !isStayLinkRevision(value.stayRevision) ||
    (value.issuedForRevision !== null &&
      (!isStayLinkRevision(value.issuedForRevision) ||
        value.issuedForRevision > value.stayRevision)) ||
    (value.expiresAt !== null && !isStayLinkTimestamp(value.expiresAt)) ||
    (value.updatedAt !== null && !isStayLinkTimestamp(value.updatedAt)) ||
    value.issued !== (value.issuedForRevision !== null) ||
    value.issued !== (value.expiresAt !== null) ||
    (value.version === 0) !== (value.updatedAt === null) ||
    (value.issued && value.version === 0) ||
    (value.enabled &&
      (!value.issued || value.issuedForRevision !== value.stayRevision))
  )
    throw invalidStayLinkResponse();

  // enabled is the server's access decision. A GET lacks stay/property activity
  // and server time, so the client cannot infer the reverse from these fields.
  return {
    stayId: value.stayId.toLowerCase(),
    issued: value.issued,
    enabled: value.enabled,
    version: value.version,
    stayRevision: value.stayRevision,
    issuedForRevision: value.issuedForRevision,
    expiresAt: value.expiresAt,
    updatedAt: value.updatedAt,
  };
}

function readChangedStatus(
  value: unknown,
  expectedId: string,
  previous: AdminStayLinkStatus,
): AdminStayLinkStatus {
  const prior = readAdminStayLinkStatus(previous, expectedId);
  const status = readAdminStayLinkStatus(value, expectedId);
  if (
    prior.version === STAY_LINK_MAX_VERSION ||
    status.version !== prior.version + 1 ||
    status.stayRevision !== prior.stayRevision ||
    status.updatedAt === null ||
    (prior.updatedAt !== null &&
      Date.parse(status.updatedAt) <= Date.parse(prior.updatedAt))
  )
    throw invalidStayLinkResponse();
  return status;
}

function isIssuedUrl(
  value: unknown,
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
      url.pathname === '/guest/stay' &&
      url.search === '' &&
      /^#token=[A-Za-z0-9_-]{43}$/.test(url.hash) &&
      // Reject normalized disguises, extra markers and embedded controls.
      url.href === value &&
      value === `${origin.origin}/guest/stay${url.hash}`
    );
  } catch {
    return false;
  }
}

export function readAdminStayLinkIssue(
  value: unknown,
  expectedId: string,
  previous: AdminStayLinkStatus,
  checkOutAt: string,
  expectedFrontendOrigin: string,
): AdminStayLinkIssue {
  const status = readChangedStatus(value, expectedId, previous);
  if (
    !isRecord(value) ||
    !isStayLinkTimestamp(checkOutAt) ||
    !status.issued ||
    status.issuedForRevision !== status.stayRevision ||
    status.expiresAt === null ||
    Date.parse(status.expiresAt) !==
      Date.parse(checkOutAt) + STAY_LINK_GRACE_MS ||
    // Issuance requires an active stay and property. Expiry can cross while
    // the transaction returns; a disabled receipt is coherent only then.
    (!status.enabled && Date.parse(status.expiresAt) > Date.now()) ||
    !isIssuedUrl(value.url, expectedFrontendOrigin)
  )
    throw invalidStayLinkResponse();
  return { ...status, url: value.url };
}

export function readAdminStayLinkRevoke(
  value: unknown,
  expectedId: string,
  previous: AdminStayLinkStatus,
): AdminStayLinkStatus {
  const status = readChangedStatus(value, expectedId, previous);
  if (status.issued || status.enabled) throw invalidStayLinkResponse();
  return status;
}
