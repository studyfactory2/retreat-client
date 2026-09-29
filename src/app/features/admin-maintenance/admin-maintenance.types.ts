export type MaintenanceStatus =
  'UNFINISHED' | 'EXPIRED' | 'ACCESS_BLOCKED' | 'COMPLETED' | 'NEEDS_REVIEW';

export type MaintenanceReviewReason =
  | 'INVALID_RECORD'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_UNAVAILABLE'
  | 'PROPERTY_INACTIVE'
  | 'STAFF_ASSIGNMENT_CHANGED'
  | 'STAFF_INACTIVE';

export interface AdminMaintenanceInput {
  page: number;
  propertyId?: string;
  from?: string;
  to?: string;
  dateField: string;
  view: string;
}

export interface AdminMaintenanceItem {
  id: string;
  property: {
    id: string;
    name: string;
    region: string | null;
    isActive: boolean;
  };
  staff: { id: string | null; name: string | null };
  status: MaintenanceStatus;
  reviewReasons: MaintenanceReviewReason[];
  startedAt: string | null;
  updatedAt: string;
  submittedAt: string | null;
  expiresAt: string | null;
  currentRevision: number;
}

export interface AdminMaintenanceDto {
  items: AdminMaintenanceItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  asOf: string;
  timezone: 'Asia/Seoul';
}
