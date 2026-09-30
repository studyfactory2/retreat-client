import { ApiRequestError } from '../../core/api/api-error';
import type {
  CreateAdminIssueCategoryInput,
  GetAdminIssueCategoriesInput,
  UpdateAdminIssueCategoryInput,
} from './admin-issue-category.types';

export const ISSUE_CATEGORY_PAGE_SIZE = 12;
export const PAGE_SIZE = ISSUE_CATEGORY_PAGE_SIZE;
export const MAX_CATEGORY_PAGE = 100_000;
export const CATEGORY_LIMITS = {
  name: 100,
  search: 100,
  sortOrder: 2_147_483_647,
} as const;
export const FALLBACK_CATEGORY_NAME = '기타';

export function isIssueCategoryId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export function requireIssueCategoryId(value: unknown): string {
  if (!isIssueCategoryId(value))
    throw new ApiRequestError(
      '이상사항 분류 ID를 확인해 주세요.',
      400,
      'INVALID_ISSUE_CATEGORY_ID',
    );
  return value.toLowerCase();
}

export function isCategoryTimestamp(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
  )
    return false;
  const timestamp = Date.parse(value);
  return (
    Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value
  );
}

export function invalidCategoryResponse(): ApiRequestError {
  return new ApiRequestError(
    '이상사항 분류 응답을 확인할 수 없습니다. 최신 정보를 다시 불러와 주세요.',
    200,
    'INVALID_ISSUE_CATEGORY_RESPONSE',
  );
}

function invalidInput(field: string, message: string): never {
  throw new ApiRequestError(message, 400, 'INVALID_ISSUE_CATEGORY_INPUT', [
    { field, messages: [message] },
  ]);
}

function requireRecord(
  value: unknown,
): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    invalidInput('category', '이상사항 분류 입력 형식을 확인해 주세요.');
}

function prepareName(value: unknown): string {
  if (typeof value !== 'string' || !value.trim())
    invalidInput('name', '분류명을 입력해 주세요.');
  const name = value.trim();
  if ([...name].length > CATEGORY_LIMITS.name)
    invalidInput('name', '분류명은 100자 이하여야 합니다.');
  return name;
}

function prepareSortOrder(value: unknown): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > CATEGORY_LIMITS.sortOrder
  )
    invalidInput(
      'sortOrder',
      '표시 순서는 0 이상 2,147,483,647 이하의 정수여야 합니다.',
    );
  return value;
}

export function prepareCategoryFilters(
  input: GetAdminIssueCategoriesInput,
): GetAdminIssueCategoriesInput {
  requireRecord(input);
  if (
    !Number.isInteger(input.page) ||
    input.page < 1 ||
    input.page > MAX_CATEGORY_PAGE ||
    (input.search !== undefined &&
      (typeof input.search !== 'string' ||
        [...input.search.trim()].length > CATEGORY_LIMITS.search)) ||
    (input.isActive !== undefined && typeof input.isActive !== 'boolean')
  )
    throw new ApiRequestError(
      '이상사항 분류 검색 조건을 확인해 주세요.',
      400,
      'INVALID_ISSUE_CATEGORY_FILTER',
    );
  return {
    page: input.page,
    ...(input.search?.trim() ? { search: input.search.trim() } : {}),
    ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
  };
}

export function prepareCreateAdminIssueCategory(
  input: CreateAdminIssueCategoryInput,
): CreateAdminIssueCategoryInput {
  requireRecord(input);
  return {
    name: prepareName(input.name),
    ...(input.sortOrder === undefined
      ? {}
      : { sortOrder: prepareSortOrder(input.sortOrder) }),
  };
}

export function prepareUpdateAdminIssueCategory(
  input: UpdateAdminIssueCategoryInput,
): UpdateAdminIssueCategoryInput {
  requireRecord(input);
  if (!isCategoryTimestamp(input.expectedUpdatedAt))
    invalidInput('expectedUpdatedAt', '최신 분류 수정 일시를 확인해 주세요.');
  if (input.isActive !== undefined && typeof input.isActive !== 'boolean')
    invalidInput('isActive', '활성 여부를 확인해 주세요.');
  if (
    input.name === undefined &&
    input.sortOrder === undefined &&
    input.isActive === undefined
  )
    throw new ApiRequestError(
      '변경할 내용을 입력해 주세요.',
      400,
      'EMPTY_UPDATE',
    );
  return {
    expectedUpdatedAt: input.expectedUpdatedAt,
    ...(input.name === undefined ? {} : { name: prepareName(input.name) }),
    ...(input.sortOrder === undefined
      ? {}
      : { sortOrder: prepareSortOrder(input.sortOrder) }),
    ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
  };
}
