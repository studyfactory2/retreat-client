export type QrFlow = 'GUEST' | 'STAFF';

export interface QrState {
  issued: boolean;
  enabled: boolean;
  rotatedAt: string | null;
}

export interface PropertyQrStatus {
  propertyId: string;
  propertyIsActive: boolean;
  guest: QrState;
  staff: QrState;
}

export interface QrIssue {
  propertyId: string;
  flow: QrFlow;
  url: string;
  rotatedAt: string;
}
