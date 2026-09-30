export interface AdminStayLinkStatus {
  stayId: string;
  issued: boolean;
  enabled: boolean;
  version: number;
  stayRevision: number;
  issuedForRevision: number | null;
  expiresAt: string | null;
  updatedAt: string | null;
}

export interface AdminStayLinkIssue extends AdminStayLinkStatus {
  url: string;
}

export type StayLinkAction = 'issue' | 'revoke';
