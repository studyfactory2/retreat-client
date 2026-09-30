import type {
  AdminIssueCategoryDto,
  CreateAdminIssueCategoryInput,
  GetAdminIssueCategoriesInput,
  UpdateAdminIssueCategoryInput,
} from '../../../../features/admin-issue-categories/admin-issue-category.types';
import {
  CATEGORY_LIMITS,
  FALLBACK_CATEGORY_NAME,
  MAX_CATEGORY_PAGE,
} from '../../../../features/admin-issue-categories/admin-issue-category-validation';

export type CategoryFormValues = {
  name: string;
  sortOrder: string;
  isActive: boolean;
};
export type CategoryFormErrors = Partial<Record<'name' | 'sortOrder', string>>;
export type CategoryFiltersValue = {
  search: string;
  activity: 'all' | 'active' | 'inactive';
};

export function createCategoryValues(
  original?: AdminIssueCategoryDto,
): CategoryFormValues {
  return {
    name: original?.name ?? '',
    sortOrder: String(original?.sortOrder ?? 0),
    isActive: original?.isActive ?? true,
  };
}
export function validateCategoryForm(
  values: CategoryFormValues,
  original?: AdminIssueCategoryDto,
): CategoryFormErrors {
  const errors: CategoryFormErrors = {};
  const name = values.name.trim();
  if (!name) errors.name = '분류명을 입력해 주세요.';
  else if ([...name].length > CATEGORY_LIMITS.name)
    errors.name = '분류명은 100자 이내로 입력해 주세요.';
  else if (
    original &&
    ((original.isFallback && name !== original.name) ||
      (!original.isFallback && name === FALLBACK_CATEGORY_NAME))
  )
    errors.name =
      '기타는 기본 분류이므로 이름을 변경하거나 다른 분류를 기타로 바꿀 수 없습니다.';
  if (original?.isFallback && original.isActive && !values.isActive)
    errors.name = '기타는 기본 분류이므로 비활성화할 수 없습니다.';
  const rawOrder = values.sortOrder.trim();
  const order = Number(rawOrder);
  if (
    !/^\d+$/.test(rawOrder) ||
    !Number.isSafeInteger(order) ||
    order > CATEGORY_LIMITS.sortOrder
  )
    errors.sortOrder = '표시 순서는 0~2,147,483,647의 정수로 입력해 주세요.';
  return errors;
}
export function buildCreateCategoryInput(
  values: CategoryFormValues,
): CreateAdminIssueCategoryInput {
  return {
    name: values.name.trim(),
    sortOrder: Number(values.sortOrder.trim()),
  };
}
export function buildUpdateCategoryInput(
  original: AdminIssueCategoryDto,
  values: CategoryFormValues,
): UpdateAdminIssueCategoryInput | null {
  const normalized = buildCreateCategoryInput(values);
  const body: UpdateAdminIssueCategoryInput = {
    expectedUpdatedAt: original.updatedAt,
  };
  if (normalized.name !== original.name) body.name = normalized.name;
  if (normalized.sortOrder !== original.sortOrder)
    body.sortOrder = normalized.sortOrder;
  if (values.isActive !== original.isActive) body.isActive = values.isActive;
  return Object.keys(body).length > 1 ? body : null;
}
export function categoryFilterError(
  values: CategoryFiltersValue,
): string | null {
  return [...values.search.trim()].length > CATEGORY_LIMITS.search
    ? '검색어는 100자 이내로 입력해 주세요.'
    : null;
}
export function categorySearch(input: GetAdminIssueCategoriesInput): string {
  const query = new URLSearchParams();
  if (input.search?.trim()) query.set('search', input.search.trim());
  if (input.isActive !== undefined)
    query.set('status', input.isActive ? 'active' : 'inactive');
  if (input.page > 1) query.set('page', String(input.page));
  return query.size ? `?${query}` : '';
}
export function categoryFilterInput(
  values: CategoryFiltersValue,
): GetAdminIssueCategoriesInput {
  return {
    page: 1,
    search: values.search.trim() || undefined,
    isActive:
      values.activity === 'all' ? undefined : values.activity === 'active',
  };
}
export function readCategoryFilters(query: URLSearchParams) {
  const rawPage = query.get('page') ?? '1';
  const page = Number(rawPage);
  const rawStatus = query.get('status');
  const activity =
    rawStatus === 'active' || rawStatus === 'inactive' ? rawStatus : 'all';
  const values: CategoryFiltersValue = {
    search: query.get('search') ?? '',
    activity,
  };
  const invalidPage =
    !/^\d+$/.test(rawPage) ||
    !Number.isSafeInteger(page) ||
    page < 1 ||
    page > MAX_CATEGORY_PAGE;
  const invalidStatus =
    rawStatus !== null && rawStatus !== 'active' && rawStatus !== 'inactive';
  const duplicate = ['page', 'search', 'status'].some(
    (key) => query.getAll(key).length > 1,
  );
  return {
    values,
    input: { ...categoryFilterInput(values), page: invalidPage ? 1 : page },
    error:
      categoryFilterError(values) ??
      (invalidPage || invalidStatus || duplicate
        ? '조회 주소의 조건을 확인해 주세요. 조건을 다시 조회하거나 초기화해 주세요.'
        : null),
  };
}
