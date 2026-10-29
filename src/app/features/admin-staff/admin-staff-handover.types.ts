import type {
  AdminStaffDto,
  AssignedStaffPropertyDto,
} from './admin-staff.types';

export interface StaffHandoverProperty extends AssignedStaffPropertyDto {
  unfinishedDraftCount: number;
}

export interface StaffDeactivationAssignment {
  propertyId: string;
  propertyName: string;
  propertyRegion: string | null;
  isActive: boolean;
  replacementStaffId: string | null;
  replacementStaffName: string | null;
}

export interface StaffDeactivationAudit {
  id: string;
  deactivatedAt: string;
  actor: { id: string; name: string };
  assignments: StaffDeactivationAssignment[];
  revokedDraftCount: number;
  reassignedPropertyIds: string[];
  clearedPropertyIds: string[];
  staffQrReissuePropertyIds: string[];
}

export interface StaffDeactivationPreview {
  staff: AdminStaffDto;
  expectedStateToken: string;
  properties: StaffHandoverProperty[];
  unfinishedDraftCount: number;
  latestDeactivation: StaffDeactivationAudit | null;
}

export interface DeactivateStaffInput {
  expectedStateToken: string;
  assignments: {
    propertyId: string;
    replacementStaffId: string | null;
  }[];
}

export interface StaffDeactivationResult extends StaffDeactivationAudit {
  staff: AdminStaffDto;
}
