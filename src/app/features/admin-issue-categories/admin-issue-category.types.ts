export interface AdminIssueCategoryDto {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  isFallback: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListDto<T = AdminIssueCategoryDto> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type AdminIssueCategoryListDto = ListDto<AdminIssueCategoryDto>;

export interface GetAdminIssueCategoriesInput {
  page: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateAdminIssueCategoryInput {
  name: string;
  sortOrder?: number;
}

export interface UpdateAdminIssueCategoryInput {
  expectedUpdatedAt: string;
  name?: string;
  sortOrder?: number;
  isActive?: boolean;
}
