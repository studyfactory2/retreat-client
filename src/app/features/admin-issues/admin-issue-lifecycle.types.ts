import type { IssueStatus } from './admin-issues.types';

export type IssueLifecycleAction = 'cancel' | 'restore';

export interface ChangeAdminIssueLifecycleInput {
  expectedVersion: number;
  reason: string;
}

export interface AdminIssueLifecycleReceipt {
  id: string;
  eventId: string;
  version: number;
  status: IssueStatus;
  updatedAt: string;
  cancelledAt: string | null;
  cancellationReason: string | null;
}
