import { ApiRequestError } from '../../core/api/api-error';
import type {
  CreateAdminStaffInput,
  GetAdminStaffInput,
  UpdateAdminStaffInput,
} from './admin-staff.types';

export const STAFF_PAGE_SIZE = 12;
export const MAX_STAFF_PAGE = 100_000;

export function isStaffId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export function requireStaffId(value: unknown): string {
  if (!isStaffId(value))
    throw new ApiRequestError(
      '직원 정보를 확인해 주세요.',
      400,
      'INVALID_STAFF_ID',
    );
  return value.toLowerCase();
}

export function invalidStaffResponse(): ApiRequestError {
  return new ApiRequestError(
    '직원 응답을 확인할 수 없습니다. 최신 정보를 다시 불러와 주세요.',
    200,
    'INVALID_STAFF_RESPONSE',
  );
}

function invalidField(field: string, message: string): never {
  throw new ApiRequestError(message, 400, 'INVALID_STAFF_INPUT', [
    { field, messages: [message] },
  ]);
}

function requireRecord(
  value: unknown,
): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new ApiRequestError(
      '직원 정보를 확인해 주세요.',
      400,
      'INVALID_STAFF_INPUT',
    );
}

function prepareName(value: unknown): string {
  if (typeof value !== 'string' || !value.trim())
    invalidField('name', '직원 이름을 입력해 주세요.');
  const name = value.trim();
  if ([...name].length > 100)
    invalidField('name', '직원 이름은 100자 이하여야 합니다.');
  return name;
}

function prepareOptionalText(
  field: 'phone' | 'company' | 'department',
  value: unknown,
): string | null {
  const label = { phone: '연락처', company: '회사명', department: '부서명' }[
    field
  ];
  const limit = field === 'phone' ? 32 : 100;
  if (value === null) return null;
  if (typeof value !== 'string')
    invalidField(field, `${label}은 문자열이어야 합니다.`);
  const text = value.trim();
  if ([...text].length > limit)
    invalidField(field, `${label}은 ${limit}자 이하여야 합니다.`);
  return text || null;
}

export function prepareCreateAdminStaff(
  input: CreateAdminStaffInput,
): CreateAdminStaffInput {
  requireRecord(input);
  return {
    name: prepareName(input.name),
    ...(input.phone === undefined
      ? {}
      : { phone: prepareOptionalText('phone', input.phone) }),
    ...(input.company === undefined
      ? {}
      : { company: prepareOptionalText('company', input.company) }),
    ...(input.department === undefined
      ? {}
      : { department: prepareOptionalText('department', input.department) }),
  };
}

export function prepareUpdateAdminStaff(
  input: UpdateAdminStaffInput,
): UpdateAdminStaffInput {
  requireRecord(input);
  if (input.isActive !== undefined && typeof input.isActive !== 'boolean')
    invalidField('isActive', '활성 여부를 확인해 주세요.');
  const body: UpdateAdminStaffInput = {
    ...(input.name === undefined ? {} : { name: prepareName(input.name) }),
    ...(input.phone === undefined
      ? {}
      : { phone: prepareOptionalText('phone', input.phone) }),
    ...(input.company === undefined
      ? {}
      : { company: prepareOptionalText('company', input.company) }),
    ...(input.department === undefined
      ? {}
      : { department: prepareOptionalText('department', input.department) }),
    ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
  };
  if (Object.keys(body).length === 0)
    throw new ApiRequestError(
      '변경할 직원 정보를 입력해 주세요.',
      400,
      'EMPTY_UPDATE',
    );
  return body;
}

export function prepareStaffFilters(
  input: GetAdminStaffInput,
): GetAdminStaffInput {
  if (
    typeof input !== 'object' ||
    input === null ||
    Array.isArray(input) ||
    !Number.isInteger(input.page) ||
    input.page < 1 ||
    input.page > MAX_STAFF_PAGE ||
    (input.search !== undefined &&
      (typeof input.search !== 'string' ||
        [...input.search.trim()].length > 100)) ||
    (input.isActive !== undefined && typeof input.isActive !== 'boolean')
  )
    throw new ApiRequestError(
      '직원 검색 조건을 확인해 주세요.',
      400,
      'INVALID_STAFF_FILTER',
    );
  return {
    page: input.page,
    ...(input.search?.trim() ? { search: input.search.trim() } : {}),
    ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
  };
}
