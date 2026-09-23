import { apiRequest } from '../../core/api/api-client';
import { ApiRequestError } from '../../core/api/api-error';
import type { AdminPropertyOption } from './admin-properties.types';

const PAGE_LIMIT = 100;
const MAX_PAGE = 100_000;
const PROPERTY_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface PropertyPage {
  items: AdminPropertyOption[];
  total: number;
  totalPages: number;
}

function invalidResponse(): ApiRequestError {
  return new ApiRequestError(
    '휴양소 목록을 확인할 수 없습니다. 다시 불러와 주세요.',
    200,
    'INVALID_PROPERTY_RESPONSE',
  );
}

function changedResponse(): ApiRequestError {
  return new ApiRequestError(
    '휴양소 목록이 변경되었습니다. 다시 불러와 주세요.',
    200,
    'PROPERTY_LIST_CHANGED',
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readProperty(value: unknown): AdminPropertyOption {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    !PROPERTY_ID.test(value.id) ||
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    (value.region !== null && typeof value.region !== 'string') ||
    typeof value.isActive !== 'boolean'
  )
    throw invalidResponse();
  return {
    id: value.id.toLowerCase(),
    name: value.name,
    region: value.region,
    isActive: value.isActive,
  };
}

function readPage(value: unknown, page: number): PropertyPage {
  if (
    !isRecord(value) ||
    !Array.isArray(value.items) ||
    value.page !== page ||
    value.limit !== PAGE_LIMIT ||
    typeof value.total !== 'number' ||
    !Number.isSafeInteger(value.total) ||
    value.total < 0 ||
    typeof value.totalPages !== 'number' ||
    value.totalPages !== Math.ceil(value.total / PAGE_LIMIT) ||
    value.totalPages > MAX_PAGE ||
    (page > 1 && page > value.totalPages) ||
    value.items.length !==
      Math.min(PAGE_LIMIT, value.total - (page - 1) * PAGE_LIMIT)
  )
    throw invalidResponse();
  return {
    items: value.items.map(readProperty),
    total: value.total,
    totalPages: value.totalPages,
  };
}

export async function getAdminPropertyOptions(
  token: string,
  signal?: AbortSignal,
): Promise<AdminPropertyOption[]> {
  const result: AdminPropertyOption[] = [];
  const ids = new Set<string>();
  let firstPage: PropertyPage | undefined;
  let page = 1;

  do {
    signal?.throwIfAborted();
    // Omitting isActive keeps inactive properties available for older records.
    const value = await apiRequest<unknown>(
      `/admin/properties?page=${page}&limit=${PAGE_LIMIT}`,
      { token, signal },
    );
    const current = readPage(value, page);
    if (
      firstPage &&
      (current.total !== firstPage.total ||
        current.totalPages !== firstPage.totalPages)
    )
      throw changedResponse();
    firstPage ??= current;
    for (const property of current.items) {
      if (ids.has(property.id)) throw changedResponse();
      ids.add(property.id);
      result.push(property);
    }
    page += 1;
  } while (page <= firstPage.totalPages);

  signal?.throwIfAborted();
  return result;
}
