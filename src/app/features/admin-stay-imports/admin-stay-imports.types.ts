import type { CreateAdminStayInput } from '../admin-stays/admin-stays.types';

export type StayImportStatus = 'PREVIEW' | 'CONFIRMED' | 'CANCELLED' | 'FAILED';
export type StayImportRowAction = 'CREATE' | 'UPDATE' | 'SKIP';
export type StayImportValidationStatus = 'VALID' | 'NEEDS_REVIEW' | 'INVALID';

export interface StayImportPropertyMapping {
  sheetName: string;
  propertyId: string;
}

export interface GetStayImportInput {
  page: number;
  validationStatus?: StayImportValidationStatus;
  action?: StayImportRowAction;
}

export type ReviewStayImportRowInput =
  | { id: string; action: 'SKIP' }
  | { id: string; action: 'CREATE'; data: CreateAdminStayInput };

export interface ReviewStayImportInput {
  expectedVersion: number;
  rows: ReviewStayImportRowInput[];
}

export interface ConfirmStayImportInput {
  expectedVersion: number;
}

export interface StayImportNormalizedData {
  schemaVersion: 1;
  guestName: string | null;
  company: string | null;
  department: string | null;
  phone: string | null;
  guestCount: null;
  checkInDate: string | null;
  checkOutDate: string | null;
  checkInAt: string | null;
  checkOutAt: string | null;
  notes: string | null;
  review?: {
    actor: { id: string; name: string; role: 'ADMIN' | 'STAFF' | 'GUEST' };
    at: string;
    action: 'CREATE' | 'SKIP';
  };
}

export interface StayImportValidationMessage {
  code: string;
  message: string;
  stayIds?: string[];
}

export interface StayImportRawCell {
  column: string;
  value: string | number | boolean | null;
  type: string;
  format: string | null;
  formula: boolean;
}

export interface StayImportRowDto {
  id: string;
  sheetName: string;
  rowNumber: number;
  propertyId: string | null;
  stayId: string | null;
  appliedAt: string | null;
  action: StayImportRowAction;
  validationStatus: StayImportValidationStatus;
  normalizedData: StayImportNormalizedData | null;
  validationMessages: StayImportValidationMessage[];
  rawData: { schemaVersion: 1; cells: StayImportRawCell[] };
}

export interface StayImportPreviewDto {
  batch: {
    id: string;
    status: StayImportStatus;
    version: number;
    parserVersion: 'retreat-roster-v1';
    timezone: 'Asia/Seoul';
    createdAt: string;
    confirmedAt: string | null;
    confirmedByUserId: string | null;
    source: { filename: string; sizeBytes: number };
    summary: {
      total: number;
      ready: number;
      needsReview: number;
      invalid: number;
      skipped: number;
    };
  };
  rows: {
    items: StayImportRowDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface StayImportConfirmationDto {
  batchId: string;
  status: 'CONFIRMED';
  version: number;
  confirmedAt: string;
  confirmedByUserId: string;
  createdCount: number;
  skippedCount: number;
}
