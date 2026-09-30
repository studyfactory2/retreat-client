import { apiRequest } from '../../core/api/api-client';
import type {
  AdminIssueCategoryDto,
  AdminIssueCategoryListDto,
  CreateAdminIssueCategoryInput,
  GetAdminIssueCategoriesInput,
  UpdateAdminIssueCategoryInput,
} from './admin-issue-category.types';
import {
  readAdminIssueCategory,
  readAdminIssueCategoryPage,
  verifyCreatedIssueCategory,
  verifyUpdatedIssueCategory,
} from './admin-issue-category-readers';
import {
  ISSUE_CATEGORY_PAGE_SIZE,
  prepareCategoryFilters,
  prepareCreateAdminIssueCategory,
  prepareUpdateAdminIssueCategory,
  requireIssueCategoryId,
} from './admin-issue-category-validation';

export {
  ISSUE_CATEGORY_PAGE_SIZE,
  PAGE_SIZE,
} from './admin-issue-category-validation';

export async function getAdminIssueCategories(
  input: GetAdminIssueCategoriesInput,
  token: string,
  signal?: AbortSignal,
): Promise<AdminIssueCategoryListDto> {
  const filters = prepareCategoryFilters(input);
  const query = new URLSearchParams({
    page: String(filters.page),
    limit: String(ISSUE_CATEGORY_PAGE_SIZE),
  });
  if (filters.search !== undefined) query.set('search', filters.search);
  if (filters.isActive !== undefined)
    query.set('isActive', String(filters.isActive));
  return readAdminIssueCategoryPage(
    await apiRequest<unknown>(`/admin/issue-categories?${query}`, {
      token,
      signal,
    }),
    filters,
  );
}

export async function createAdminIssueCategory(
  input: CreateAdminIssueCategoryInput,
  token: string,
  signal?: AbortSignal,
): Promise<AdminIssueCategoryDto> {
  const body = prepareCreateAdminIssueCategory(input);
  const category = readAdminIssueCategory(
    await apiRequest<unknown>('/admin/issue-categories', {
      method: 'POST',
      token,
      signal,
      body: { ...body },
    }),
  );
  verifyCreatedIssueCategory(category, body);
  return category;
}

export async function updateAdminIssueCategory(
  id: string,
  input: UpdateAdminIssueCategoryInput,
  token: string,
  signal?: AbortSignal,
): Promise<AdminIssueCategoryDto> {
  const categoryId = requireIssueCategoryId(id);
  const body = prepareUpdateAdminIssueCategory(input);
  const category = readAdminIssueCategory(
    await apiRequest<unknown>(`/admin/issue-categories/${categoryId}/update`, {
      method: 'POST',
      token,
      signal,
      body: { ...body },
    }),
    categoryId,
  );
  verifyUpdatedIssueCategory(category, body);
  return category;
}
