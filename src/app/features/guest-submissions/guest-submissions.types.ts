import type { GuestDraftType } from '../guest-drafts/guest-drafts.types';
import type { GuestPropertyDto } from '../guest-entry/guest-entry.types';

export interface GuestSubmissionPhotoInput {
  attachmentId: string;
  purpose: 'DEFECT';
  itemId: string;
}

export interface GuestSubmissionReceiptDto {
  id: string;
  status: 'SUBMITTED';
  type: GuestDraftType;
  property: GuestPropertyDto;
  visitDate: string;
  startedAt: null;
  submittedAt: string;
  revision: 1;
  answeredItemCount: number;
  photoCount: number;
  reportedIssueCount: number;
  expiresAt: string;
}
