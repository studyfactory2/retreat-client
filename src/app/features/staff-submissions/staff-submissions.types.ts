import type { StaffDraftDto } from '../staff-drafts/staff-drafts.types';

export type StaffSubmissionPhotoPurpose =
  'DEFECT' | 'REPAIR' | 'MAINTENANCE_BEFORE' | 'MAINTENANCE_AFTER';

export interface StaffSubmissionPhotoInput {
  attachmentId: string;
  purpose: StaffSubmissionPhotoPurpose;
  sectionId: string | null;
  itemId: string | null;
  areaLabel: string | null;
}

export interface StaffSubmissionReceiptDto {
  id: string;
  status: 'SUBMITTED';
  type: 'MAINTENANCE';
  property: StaffDraftDto['property'];
  visitDate: string;
  startedAt: string;
  submittedAt: string;
  revision: 1;
  answeredItemCount: number;
  photoCount: number;
  reportedIssueCount: number;
  expiresAt: string;
}
