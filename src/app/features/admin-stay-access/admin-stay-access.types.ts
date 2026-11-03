export type StayCodeMethod = 'AUTO' | 'PHONE_LAST6' | 'FIXED';
export type StayCodeAction = 'PREPARE' | 'REPLACE' | 'CONFIRM';
export type StayCodeReviewReason =
  | 'PHONE_CHANGED'
  | 'GUEST_CHANGED'
  | 'RESTORED'
  | 'PROPERTY_MODE_CHANGED'
  | 'FIXED_CODE_CHANGED'
  | 'NEIGHBOR_CODE_CONFLICT'
  | 'SOURCE_UNAVAILABLE';
export type StayCodeBlock =
  | 'CANCELLED'
  | 'ENDED'
  | 'PROPERTY_INACTIVE'
  | 'PROPERTY_UNCONFIGURED'
  | 'FIXED_CODE_MISSING';

export interface AdminStayAccessDto {
  stay: {
    id: string;
    propertyId: string;
    currentRevision: number;
    status: 'ACTIVE' | 'CANCELLED';
    checkOutAt: string;
    propertyIsActive: boolean;
  };
  propertySettings: {
    version: number;
    roomMode: 'FIXED' | 'ROTATING' | null;
    hasFixedRoomCode: boolean;
  };
  state: 'UNSET' | 'PREPARED' | 'REVIEW_REQUIRED';
  blockedReason: StayCodeBlock | null;
  phoneEligible: boolean;
  reviewReasons: StayCodeReviewReason[];
  code: null | {
    version: number;
    method: StayCodeMethod;
    preparedAt: string;
    updatedAt: string;
    sourceStayRevision: number;
    sourceSettingsVersion: number;
    phoneMatchesCurrent: boolean | null;
  };
  canConfirm: boolean;
  history: {
    version: number;
    action: 'PREPARED' | 'REPLACED' | 'CONFIRMED';
    method: StayCodeMethod;
    actorName: string;
    createdAt: string;
  }[];
}

export interface StayCodeVersions {
  expectedStayRevision: number;
  expectedSettingsVersion: number;
  expectedCodeVersion: number;
}
export type SaveStayAccessInput = StayCodeVersions &
  (
    | { action: 'PREPARE' | 'REPLACE'; method: StayCodeMethod }
    | { action: 'CONFIRM'; method?: never }
  );
