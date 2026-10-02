import type {
  GuestDraftPhotoDto,
  GuestDraftPhotoViewDto,
} from '../guest-draft-photos/guest-draft-photos.types';
import type {
  GuestDraftAnswer,
  GuestDraftAnswers,
  GuestDraftDto,
  GuestDraftType,
} from '../guest-drafts/guest-drafts.types';
import type { GuestPropertyDto } from '../guest-entry/guest-entry.types';

export interface GuestSubmissionPhotoDto extends GuestDraftPhotoDto {
  purpose: 'DEFECT';
  sectionId: string;
  itemId: string;
  areaLabel: string | null;
  sortOrder: number;
}

export type GuestSubmissionPhotoViewDto = GuestDraftPhotoViewDto;

export interface GuestSubmissionDetailDto {
  id: string;
  type: GuestDraftType;
  status: 'SUBMITTED';
  revision: number;
  property: GuestPropertyDto;
  visitDate: string;
  guest: {
    name: string;
    company: string | null;
    department: string | null;
    phone: string | null;
  };
  template: GuestDraftDto['template'];
  answers: GuestDraftAnswers;
  submittedAt: string;
  updatedAt: string;
  expiresAt: string;
  photos: GuestSubmissionPhotoDto[];
}

export interface GuestSubmissionCorrectionDto {
  id: string;
  status: 'SUBMITTED';
  revision: number;
  updatedAt: string;
  changed: boolean;
}

export interface GuestCorrectionInput {
  expectedRevision: number;
  items: Pick<
    GuestDraftAnswer,
    'itemId' | 'value' | 'description' | 'isUrgent'
  >[];
  generalNote: string | null;
  reason?: string;
}
