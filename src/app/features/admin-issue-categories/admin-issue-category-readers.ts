import type {
  AdminIssueCategoryDto,
  AdminIssueCategoryListDto,
  CreateAdminIssueCategoryInput,
  GetAdminIssueCategoriesInput,
  UpdateAdminIssueCategoryInput,
} from './admin-issue-category.types';
import {
  CATEGORY_LIMITS,
  FALLBACK_CATEGORY_NAME,
  invalidCategoryResponse,
  isCategoryTimestamp,
  isIssueCategoryId,
  ISSUE_CATEGORY_PAGE_SIZE,
  MAX_CATEGORY_PAGE,
} from './admin-issue-category-validation';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readAdminIssueCategory(
  value: unknown,
  expectedId?: string,
): AdminIssueCategoryDto {
  if (
    !isRecord(value) ||
    !isIssueCategoryId(value.id) ||
    (expectedId !== undefined &&
      value.id.toLowerCase() !== expectedId.toLowerCase()) ||
    typeof value.name !== 'string' ||
    !value.name ||
    value.name.trim() !== value.name ||
    [...value.name].length > CATEGORY_LIMITS.name ||
    typeof value.sortOrder !== 'number' ||
    !Number.isInteger(value.sortOrder) ||
    value.sortOrder < 0 ||
    value.sortOrder > CATEGORY_LIMITS.sortOrder ||
    typeof value.isActive !== 'boolean' ||
    typeof value.isFallback !== 'boolean' ||
    value.isFallback !== (value.name === FALLBACK_CATEGORY_NAME) ||
    !isCategoryTimestamp(value.createdAt) ||
    !isCategoryTimestamp(value.updatedAt) ||
    Date.parse(value.updatedAt) < Date.parse(value.createdAt)
  )
    throw invalidCategoryResponse();
  return {
    id: value.id.toLowerCase(),
    name: value.name,
    sortOrder: value.sortOrder,
    isActive: value.isActive,
    isFallback: value.isFallback,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

export function readAdminIssueCategoryPage(
  value: unknown,
  input: GetAdminIssueCategoriesInput,
): AdminIssueCategoryListDto {
  if (
    !isRecord(value) ||
    !Array.isArray(value.items) ||
    value.page !== input.page ||
    value.limit !== ISSUE_CATEGORY_PAGE_SIZE ||
    typeof value.total !== 'number' ||
    !Number.isSafeInteger(value.total) ||
    value.total < 0 ||
    typeof value.totalPages !== 'number' ||
    value.totalPages !== Math.ceil(value.total / ISSUE_CATEGORY_PAGE_SIZE) ||
    value.totalPages > MAX_CATEGORY_PAGE ||
    value.items.length !==
      Math.max(
        0,
        Math.min(
          ISSUE_CATEGORY_PAGE_SIZE,
          value.total - (input.page - 1) * ISSUE_CATEGORY_PAGE_SIZE,
        ),
      )
  )
    throw invalidCategoryResponse();
  const items = Array.from(value.items, (item) => readAdminIssueCategory(item));
  if (
    new Set(items.map((item) => item.id)).size !== items.length ||
    new Set(items.map((item) => item.name)).size !== items.length ||
    items.some(
      (item, index) =>
        (input.isActive !== undefined && item.isActive !== input.isActive) ||
        (index > 0 && items[index - 1].sortOrder > item.sortOrder),
    )
  )
    throw invalidCategoryResponse();
  // PostgreSQL defines search matching and name ordering. Numeric order is
  // checked here without substituting browser locale/case rules for the DB.
  return {
    items,
    total: value.total,
    page: input.page,
    limit: ISSUE_CATEGORY_PAGE_SIZE,
    totalPages: value.totalPages,
  };
}

export function verifyCreatedIssueCategory(
  category: AdminIssueCategoryDto,
  input: CreateAdminIssueCategoryInput,
): void {
  if (
    category.name !== input.name ||
    category.sortOrder !== (input.sortOrder ?? 0) ||
    !category.isActive
  )
    throw invalidCategoryResponse();
}

export function verifyUpdatedIssueCategory(
  category: AdminIssueCategoryDto,
  input: UpdateAdminIssueCategoryInput,
): void {
  if (
    Date.parse(category.updatedAt) < Date.parse(input.expectedUpdatedAt) ||
    Date.parse(category.createdAt) > Date.parse(input.expectedUpdatedAt) ||
    (input.name !== undefined && category.name !== input.name) ||
    (input.sortOrder !== undefined && category.sortOrder !== input.sortOrder) ||
    (input.isActive !== undefined && category.isActive !== input.isActive)
  )
    throw invalidCategoryResponse();
}
