import { apiRequest } from '../../core/api/api-client';
import {
  readAdminStayLinkIssue,
  readAdminStayLinkRevoke,
  readAdminStayLinkStatus,
} from './admin-stay-link-readers';
import type {
  AdminStayLinkIssue,
  AdminStayLinkStatus,
} from './admin-stay-link.types';
import {
  requireStayLinkChangeInput,
  requireStayLinkCheckOutAt,
  requireStayLinkId,
} from './admin-stay-link-validation';

export async function getAdminStayLink(
  id: string,
  token: string,
  signal?: AbortSignal,
): Promise<AdminStayLinkStatus> {
  const stayId = requireStayLinkId(id);
  return readAdminStayLinkStatus(
    await apiRequest<unknown>(`/admin/stays/${stayId}/guest-link`, {
      token,
      signal,
    }),
    stayId,
  );
}

export async function issueAdminStayLink(
  id: string,
  previous: AdminStayLinkStatus,
  checkOutAt: string,
  token: string,
  signal?: AbortSignal,
): Promise<AdminStayLinkIssue> {
  const stayId = requireStayLinkId(id);
  requireStayLinkChangeInput(previous, stayId);
  requireStayLinkCheckOutAt(checkOutAt);
  const prior = readAdminStayLinkStatus(previous, stayId);
  return readAdminStayLinkIssue(
    await apiRequest<unknown>(`/admin/stays/${stayId}/guest-link/issue`, {
      method: 'POST',
      token,
      signal,
      body: {
        expectedRevision: prior.stayRevision,
        expectedLinkVersion: prior.version,
      },
    }),
    stayId,
    prior,
    checkOutAt,
  );
}

export async function revokeAdminStayLink(
  id: string,
  previous: AdminStayLinkStatus,
  token: string,
  signal?: AbortSignal,
): Promise<AdminStayLinkStatus> {
  const stayId = requireStayLinkId(id);
  requireStayLinkChangeInput(previous, stayId);
  const prior = readAdminStayLinkStatus(previous, stayId);
  return readAdminStayLinkRevoke(
    await apiRequest<unknown>(`/admin/stays/${stayId}/guest-link/revoke`, {
      method: 'POST',
      token,
      signal,
      body: {
        expectedRevision: prior.stayRevision,
        expectedLinkVersion: prior.version,
      },
    }),
    stayId,
    prior,
  );
}
