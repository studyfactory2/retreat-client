export interface AdminStayDto {
  id: string;
  propertyId: string;
  guestUserId: string | null;
  guestName: string;
  company: string | null;
  department: string | null;
  phone: string | null;
  checkInAt: string;
  checkOutAt: string;
  status: 'ACTIVE' | 'CANCELLED';
  source: 'MANUAL' | 'EXCEL';
  notes: string | null;
  createdByUserId: string;
  currentRevision: number;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
  property: {
    id: string;
    name: string;
    region: string | null;
    isActive: boolean;
  };
  createdBy: {
    id: string;
    name: string;
  };
}

export interface CreateAdminStayInput {
  propertyId: string;
  guestName: string;
  checkInAt: string;
  checkOutAt: string;
  company?: string | null;
  department?: string | null;
  phone?: string | null;
  notes?: string | null;
}

export interface UpdateAdminStayInput {
  expectedRevision: number;
  guestName?: string;
  checkInAt?: string;
  checkOutAt?: string;
  company?: string | null;
  department?: string | null;
  phone?: string | null;
  notes?: string | null;
  reason?: string | null;
}
