export interface AdminPropertyDto {
  id: string;
  name: string;
  region: string | null;
  isActive: boolean;
  staffUserId: string | null;
  vehicleRegistrationEnabled: boolean;
  staff: {
    id: string;
    name: string;
    phone: string | null;
    isActive: boolean;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPropertyListDto {
  items: AdminPropertyDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetAdminPropertiesInput {
  page: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateAdminPropertyInput {
  name: string;
  region?: string | null;
  vehicleRegistrationEnabled?: boolean;
}

export interface UpdateAdminPropertyInput {
  name?: string;
  region?: string | null;
  vehicleRegistrationEnabled?: boolean;
  isActive?: boolean;
}
