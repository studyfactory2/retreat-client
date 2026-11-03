export type RoomCodeMode = 'FIXED' | 'ROTATING';
export type AccessCodeKind = 'ENTRANCE' | 'FIXED_ROOM' | 'VACANCY';
export type AccessCodeField = 'entranceCode' | 'fixedRoomCode' | 'vacancyCode';

export type AdminPropertyAccessDto = {
  property: {
    id: string;
    name: string;
    region: string | null;
    isActive: boolean;
  };
  settings: {
    version: number;
    roomMode: RoomCodeMode | null;
    hasEntranceCode: boolean;
    hasFixedRoomCode: boolean;
    hasVacancyCode: boolean;
    updatedAt: string | null;
  };
};

export type SavePropertyAccessInput = {
  expectedVersion: number;
  roomMode: RoomCodeMode;
  entranceCode?: string | null;
  fixedRoomCode?: string | null;
  vacancyCode?: string | null;
};

export type RevealedAccessCode = {
  kind: AccessCodeKind;
  code: string;
  version: number;
};
