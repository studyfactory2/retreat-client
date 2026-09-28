import type { AdminStayDto } from './admin-stays.types';

export interface GetAdminStaysInput {
  page: number;
  search?: string;
  propertyId?: string;
  status?: 'ACTIVE' | 'CANCELLED';
}

export interface AdminStayListDto {
  items: AdminStayDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ChangeAdminStayStatusInput {
  expectedRevision: number;
  reason: string;
}

export type AdminStaySnapshot = Omit<AdminStayDto, 'createdBy'> & {
  schemaVersion: 1;
};

export interface AdminStayActorSnapshot {
  schemaVersion: 1;
  id: string;
  name: string;
  role: 'ADMIN' | 'STAFF' | 'GUEST';
}

export interface AdminStayRevisionDto {
  id: string;
  stayId: string;
  version: number;
  action: 'CREATED' | 'CORRECTED' | 'CANCELLED' | 'RESTORED';
  snapshot: AdminStaySnapshot;
  actorUserId: string;
  actorSnapshot: AdminStayActorSnapshot;
  reason: string | null;
  importRowId: string | null;
  createdAt: string;
}

export interface AdminStayRevisionListDto {
  items: AdminStayRevisionDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
