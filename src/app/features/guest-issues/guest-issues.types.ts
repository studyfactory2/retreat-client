import type {
  GuestDraftPhotoDto,
  GuestDraftPhotoViewDto,
  RemovedGuestDraftPhotoDto,
} from '../guest-draft-photos/guest-draft-photos.types';

export interface GuestIssueCategoryDto {
  id: string;
  name: string;
}

export interface GuestIssueCategoryListDto {
  items: GuestIssueCategoryDto[];
}

export interface GuestIssueReceiptDto {
  issueId: string;
  status: 'RECEIVED';
  property: { id: string; name: string };
  receivedAt: string;
}

export interface GuestIssuePhotoClaim {
  id: string;
  token: string;
}

export interface GuestIssueReportFields {
  categoryId: string;
  guestName: string;
  title: string;
  description: string;
}

export interface GuestIssueReportInput {
  requestKey: string;
  categoryId: string;
  guestName: string;
  title: string;
  description: string | null;
  photos: GuestIssuePhotoClaim[];
}

export interface GuestIssueReportDraft {
  requestKey: string;
  categoryId: string;
  guestName: string;
  title: string;
  description?: string | null;
  photos?: GuestIssuePhotoClaim[];
}

export interface GuestIssuePhotoUploadDto {
  photo: GuestDraftPhotoDto;
  token: string;
  expiresAt: string;
}

export type GuestIssuePhotoViewDto = GuestDraftPhotoViewDto;
export type RemovedGuestIssuePhotoDto = RemovedGuestDraftPhotoDto;
