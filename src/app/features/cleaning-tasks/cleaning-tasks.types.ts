export type CleaningTaskStatus =
  'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export interface CleaningTaskDto {
  id: string;
  property: {
    id: string;
    name: string;
    staffUserId: string | null;
    staffName: string | null;
  };
  departingStay: {
    id: string;
    checkOutAt: string;
    currentRevision: number;
    status: 'ACTIVE' | 'CANCELLED';
  } | null;
  source: 'AUTO' | 'MANUAL';
  status: CleaningTaskStatus;
  dueAt: string;
  version: number;
  currentSubmissionId: string | null;
  completedAt: string | null;
  note: string | null;
  canStart: boolean;
  requiresReview: boolean;
}
export interface CleaningTaskListDto {
  items: CleaningTaskDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
export interface TaskPasswordDto {
  taskId: string;
  fingerprint: string;
  kind: 'NEXT_STAY' | 'VACANCY' | 'FIXED' | 'BLOCKED';
  canComplete: boolean;
  blockedReason: string | null;
  nextCheckInAt: string | null;
  requiresChange: boolean;
}
export interface TaskConfirmation {
  fingerprint: string;
  passwordChanged: boolean;
  guestDeparted: boolean;
}
