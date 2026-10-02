import type {
  GuestChecklistDefinition,
  GuestPropertyDto,
} from '../guest-entry/guest-entry.types';

export type GuestDraftType = 'CHECK_IN' | 'CHECK_OUT';

export interface GuestDraftAnswer {
  itemId: string;
  value: 'NORMAL' | 'ABNORMAL';
  description: string | null;
  isUrgent: boolean;
  repairReported: false;
  repairNote: null;
}

export interface GuestDraftAnswers {
  schemaVersion: 1;
  items: GuestDraftAnswer[];
  generalNote: string | null;
}

export interface GuestDraftDto {
  id: string;
  property: GuestPropertyDto;
  type: GuestDraftType;
  status: 'DRAFT';
  visitDate: string;
  author: {
    schemaVersion: 1;
    role: 'GUEST';
    name: string;
    company: string | null;
    department: string | null;
    phone: string | null;
  };
  template: {
    schemaVersion: 1;
    id: string;
    type: GuestDraftType;
    title: string;
    version: number;
    definition: GuestChecklistDefinition;
  };
  answers: GuestDraftAnswers;
  startedAt: null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface StartGuestDraftInput {
  requestKey: string;
  type: GuestDraftType;
  visitDate?: string;
  guestName?: string;
  company?: string | null;
  department?: string | null;
  phone?: string | null;
}

export interface StartGuestDraftDto {
  draft: GuestDraftDto;
  accessToken: string;
  url: string;
  expiresAt: string;
}
