export interface AssignedStaffPropertyDto {
  id: string;
  name: string;
  region: string | null;
  isActive: boolean;
}

export interface AdminStaffDto {
  id: string;
  name: string;
  role: 'STAFF';
  phone: string | null;
  company: string | null;
  department: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assignedProperties: AssignedStaffPropertyDto[];
}

export interface AdminStaffListDto {
  items: AdminStaffDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetAdminStaffInput {
  page: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateAdminStaffInput {
  name: string;
  phone?: string | null;
  company?: string | null;
  department?: string | null;
}

export interface UpdateAdminStaffInput {
  name?: string;
  phone?: string | null;
  company?: string | null;
  department?: string | null;
  isActive?: boolean;
}
