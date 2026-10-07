export type AdminSubmissionLifecycleAction = 'cancel' | 'restore';

export interface AdminSubmissionLifecycleInput {
  expectedRevision: number;
  reason: string;
}

export interface AdminSubmissionLifecycleReceipt {
  id: string;
  status: 'CANCELLED' | 'SUBMITTED';
  revision: number;
  updatedAt: string;
  cancelledAt: string | null;
}
