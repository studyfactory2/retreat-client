export type GuestAccessCodeKind = 'ENTRANCE' | 'ROOM';

export interface GuestAccessCodeScope {
  stayId: string;
  propertyId: string;
}

export interface GuestAccessCodesDto extends GuestAccessCodeScope {
  state: 'SCHEDULED' | 'AVAILABLE' | 'ENDED' | 'UNAVAILABLE';
  opensAt: string;
  closesAt: string;
  serverTime: string;
  entranceAvailable: boolean;
  roomAvailable: boolean;
  roomMode: 'ROTATING' | 'FIXED' | null;
  fingerprint: string | null;
}

export interface GuestAccessCodeRevealDto extends GuestAccessCodeScope {
  kind: GuestAccessCodeKind;
  code: string;
  fingerprint: string;
  serverTime: string;
  visibleUntil: string;
}
