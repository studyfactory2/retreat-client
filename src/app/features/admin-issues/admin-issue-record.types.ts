export type IssueStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED';
export type IssueEventType =
  | 'REPORTED'
  | 'UPDATED'
  | 'STATUS_CHANGED'
  | 'REPAIR_REPORTED'
  | 'RESOLVED'
  | 'REOPENED'
  | 'CANCELLED'
  | 'RESTORED';
export type IssueActorSource =
  'ADMIN_SESSION' | 'GUEST_QR' | 'STAFF_QR' | 'PRIVATE_LINK' | 'SYSTEM';

export interface AdminIssueRecordDto {
  id: string;
  property: { id: string; name: string; region: string | null };
  category: { id: string; name: string };
  title: string;
  description: string | null;
  areaLabel: string | null;
  isUrgent: boolean;
  status: IssueStatus;
  sourceSubmissionId: string | null;
  sourceItemId: string | null;
  sourceRevisionId: string | null;
  recurrenceOfIssueId: string | null;
  currentVersion: number;
  reportedAt: string;
  resolvedAt: string | null;
  resolvedByUserId: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  updatedAt: string;
  source: {
    checklistType: 'CHECK_IN' | 'CHECK_OUT' | 'MAINTENANCE';
    templateId: string;
    templateTitle: string;
    templateVersion: number;
    sectionId: string;
  } | null;
}

export interface AdminIssueActorDto {
  id: string | null;
  role: 'ADMIN' | 'STAFF' | 'GUEST';
  name: string;
}

export interface AdminIssuePhotoDto {
  id: string;
  status: 'READY';
  filename: string;
  contentType: 'image/jpeg';
  sizeBytes: number;
  width: number;
  height: number;
  createdAt: string;
  sortOrder: number;
}

export interface AdminIssueEventDto {
  id: string;
  issueId: string;
  version: number;
  type: IssueEventType;
  actorSource: IssueActorSource;
  actor: AdminIssueActorDto;
  sourceRevisionId: string | null;
  note: string | null;
  fromStatus: IssueStatus | null;
  toStatus: IssueStatus | null;
  createdAt: string;
  record: AdminIssueRecordDto;
  photos: AdminIssuePhotoDto[];
}
