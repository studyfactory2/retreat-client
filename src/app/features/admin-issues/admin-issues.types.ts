import type {
  AdminIssueEventDto,
  AdminIssueRecordDto,
} from './admin-issue-record.types';

export type {
  AdminIssueActorDto,
  AdminIssueEventDto,
  AdminIssuePhotoDto,
  AdminIssueRecordDto,
  IssueActorSource,
  IssueEventType,
  IssueStatus,
} from './admin-issue-record.types';

export interface AdminIssueFilters {
  page: number;
  propertyId?: string;
  status?: string;
  isUrgent?: string;
  from?: string;
  to?: string;
}

export type AdminIssueSummaryDto = Pick<
  AdminIssueRecordDto,
  | 'id'
  | 'property'
  | 'category'
  | 'title'
  | 'areaLabel'
  | 'isUrgent'
  | 'status'
  | 'currentVersion'
  | 'reportedAt'
  | 'resolvedAt'
  | 'updatedAt'
>;

export interface AdminIssueDetailDto {
  issue: AdminIssueRecordDto;
  report: AdminIssueEventDto;
  latestEvent: AdminIssueEventDto;
}

interface IssuePage<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type AdminIssueListDto = IssuePage<AdminIssueSummaryDto>;
export type AdminIssueHistoryDto = IssuePage<AdminIssueEventDto>;

export interface AdminIssuePhotoViewDto {
  url: string;
  expiresAt: string;
}
