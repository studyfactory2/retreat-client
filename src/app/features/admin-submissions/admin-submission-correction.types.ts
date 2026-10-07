import type {
  AdminSubmissionAnswer,
  AdminSubmissionAnswers,
  AdminSubmissionPhoto,
} from './admin-submissions.types';

export interface AdminSubmissionCorrectionItem {
  itemId: string;
  value: 'NORMAL' | 'ABNORMAL';
  description?: string | null;
  isUrgent?: boolean;
}

export interface AdminSubmissionCorrectionInput {
  expectedRevision: number;
  items: readonly AdminSubmissionCorrectionItem[];
  generalNote: string | null;
  reason: string;
}

export interface AdminSubmissionCorrectionReceipt {
  id: string;
  status: 'SUBMITTED';
  revision: number;
  updatedAt: string;
  changed: boolean;
}

export interface AdminSubmissionCorrectionEffect {
  answers: AdminSubmissionAnswers;
  photos: AdminSubmissionPhoto[];
  removedPhotos: AdminSubmissionPhoto[];
  clearedRepairs: AdminSubmissionAnswer[];
  changed: boolean;
}
