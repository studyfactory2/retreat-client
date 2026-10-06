import type { StaffChecklistDefinition } from '../staff-entry/staff-entry.types';

export interface StaffDraftAnswer {
  itemId: string;
  value: 'NORMAL' | 'ABNORMAL';
  description: string | null;
  isUrgent: boolean;
  repairReported: boolean;
  repairNote: string | null;
}

export interface StaffDraftAnswers {
  schemaVersion: 1;
  items: StaffDraftAnswer[];
  generalNote: string | null;
}

export interface StaffDraftDto {
  id: string;
  property: { id: string; name: string; region: string | null };
  type: 'MAINTENANCE';
  status: 'DRAFT';
  visitDate: string;
  author: {
    schemaVersion: 1;
    role: 'STAFF';
    name: string;
    company: null;
    department: null;
    phone: null;
  };
  template: {
    schemaVersion: 1;
    id: string;
    type: 'MAINTENANCE';
    title: string;
    version: number;
    definition: StaffChecklistDefinition;
  };
  answers: StaffDraftAnswers;
  startedAt: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface StartStaffDraftInput {
  requestKey: string;
  confirmedStaffId: string;
}

export interface StartStaffDraftDto {
  draft: StaffDraftDto;
  accessToken: string;
  url: string;
  expiresAt: string;
}
