export type GuestAccessKind = 'qr' | 'stay';

export interface GuestPropertyDto {
  id: string;
  name: string;
  region: string | null;
}

export interface GuestPublicPropertyDto extends GuestPropertyDto {
  publicContactPhone: string | null;
}

export interface GuestChecklistDefinition {
  schemaVersion: 1;
  sections: {
    id: string;
    title: string;
    items: {
      id: string;
      label: string;
      required: boolean;
      answerType: 'NORMAL_ABNORMAL';
    }[];
  }[];
}

export interface GuestChecklistDto {
  id: string;
  type: 'CHECK_IN' | 'CHECK_OUT';
  title: string;
  version: number;
  definition: GuestChecklistDefinition;
}

export interface GuestQrContextDto {
  flow: 'GUEST';
  property: GuestPublicPropertyDto;
  checklists: GuestChecklistDto[];
}

export interface GuestStayContextDto {
  stayId: string;
  guestName: string;
  checkInAt: string;
  checkOutAt: string;
  expiresAt: string;
  property: GuestPublicPropertyDto & { vehicleRegistrationEnabled: boolean };
  checklists: GuestChecklistDto[];
}

export type GuestEntryContext =
  | { kind: 'qr'; context: GuestQrContextDto }
  | { kind: 'stay'; context: GuestStayContextDto };

export interface GuestPropertyGuideDto {
  property: GuestPropertyDto;
  guide: {
    title: string;
    content: string;
    version: number;
    updatedAt: string;
  } | null;
}
