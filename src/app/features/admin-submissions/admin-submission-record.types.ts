export type AdminSubmissionType = 'CHECK_IN' | 'CHECK_OUT' | 'MAINTENANCE';
export type AdminSubmissionStatus = 'SUBMITTED' | 'CANCELLED';
export type AdminSubmissionActorSource =
  'ADMIN_SESSION' | 'GUEST_QR' | 'STAFF_QR' | 'PRIVATE_LINK' | 'SYSTEM';

export interface AdminSubmissionProperty {
  id: string;
  name: string;
  region: string | null;
}

export interface AdminSubmissionAuthor {
  id: string | null;
  role: 'GUEST' | 'STAFF';
  name: string;
  company: string | null;
  department: string | null;
  phone: string | null;
}

export interface AdminSubmissionActor {
  id: string | null;
  role: 'ADMIN' | 'GUEST' | 'STAFF';
  name: string;
}

export interface AdminSubmissionChecklistItem {
  id: string;
  label: string;
  required: boolean;
  answerType: 'NORMAL_ABNORMAL';
}

export interface AdminSubmissionChecklistSection {
  id: string;
  title: string;
  items: AdminSubmissionChecklistItem[];
}

export interface AdminSubmissionTemplate {
  schemaVersion: 1;
  id: string;
  type: AdminSubmissionType;
  title: string;
  version: number;
  definition: {
    schemaVersion: 1;
    sections: AdminSubmissionChecklistSection[];
  };
}

export interface AdminSubmissionAnswer {
  itemId: string;
  value: 'NORMAL' | 'ABNORMAL';
  description: string | null;
  isUrgent: boolean;
  repairReported: boolean;
  repairNote: string | null;
}

export interface AdminSubmissionAnswers {
  schemaVersion: 1;
  items: AdminSubmissionAnswer[];
  generalNote: string | null;
}

export interface AdminSubmissionRecord {
  property: AdminSubmissionProperty;
  type: AdminSubmissionType;
  visitDate: string;
  stayId: string | null;
  authorSource: AdminSubmissionActorSource;
  author: AdminSubmissionAuthor;
  template: AdminSubmissionTemplate;
  answers: AdminSubmissionAnswers;
  startedAt: string | null;
  submittedAt: string;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}
