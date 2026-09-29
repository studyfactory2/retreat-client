import type {
  AdminSubmissionActor,
  AdminSubmissionActorSource,
  AdminSubmissionAuthor,
  AdminSubmissionProperty,
  AdminSubmissionRecord,
  AdminSubmissionStatus,
  AdminSubmissionType,
} from './admin-submission-record.types';

export type * from './admin-submission-record.types';

export interface AdminSubmissionListInput {
  page: number;
  propertyId?: string;
  stayId?: string;
  type?: AdminSubmissionType;
  status?: AdminSubmissionStatus;
  // Retain an invalid URL value so the filter can report it without broadening.
  linkStatus?: string;
  from?: string;
  to?: string;
}

export interface AdminSubmissionSummary {
  id: string;
  stayId: string | null;
  authorSource: AdminSubmissionActorSource;
  type: AdminSubmissionType;
  status: AdminSubmissionStatus;
  currentRevision: number;
  property: AdminSubmissionProperty;
  visitDate: string;
  author: Pick<AdminSubmissionAuthor, 'id' | 'name' | 'role'>;
  startedAt: string | null;
  submittedAt: string;
  cancelledAt: string | null;
  answeredItemCount: number;
  abnormalItemCount: number;
  photoCount: number;
}

export interface AdminSubmissionPhoto {
  id: string;
  status: 'READY';
  filename: string;
  contentType: 'image/jpeg';
  sizeBytes: number;
  width: number;
  height: number;
  createdAt: string;
  purpose: 'DEFECT' | 'MAINTENANCE_BEFORE' | 'MAINTENANCE_AFTER' | 'REPAIR';
  sectionId: string | null;
  itemId: string | null;
  areaLabel: string | null;
  sortOrder: number;
}

export interface AdminSubmissionRevision {
  id: string;
  submissionId: string;
  version: number;
  action: 'SUBMITTED' | 'CORRECTED' | 'CANCELLED' | 'RESTORED';
  status: AdminSubmissionStatus;
  createdAt: string;
  reason: string | null;
  actorSource: AdminSubmissionActorSource;
  actor: AdminSubmissionActor;
  record: AdminSubmissionRecord;
  photos: AdminSubmissionPhoto[];
}

export interface AdminSubmissionDetail {
  id: string;
  status: AdminSubmissionStatus;
  currentRevision: number;
  revision: AdminSubmissionRevision;
}

export interface AdminSubmissionListDto {
  items: AdminSubmissionSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminSubmissionHistoryDto {
  items: AdminSubmissionRevision[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminSubmissionPhotoViewDto {
  url: string;
  expiresAt: string;
}
