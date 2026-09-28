import { apiRequest } from '../../core/api/api-client';
import { ApiRequestError } from '../../core/api/api-error';
import type { AdminStayDto } from './admin-stays.types';
import type {
  AdminStayListDto,
  AdminStayRevisionListDto,
  ChangeAdminStayStatusInput,
  GetAdminStaysInput,
} from './admin-stay-management.types';
import {
  readStayPage,
  readStayRevision,
} from './admin-stay-management-readers';
import {
  invalidStayResponse,
  readStay,
  requireStayId,
} from './admin-stays-readers';
import { isStayRevision } from './admin-stays-validation';

export const STAY_LIST_PAGE_SIZE = 12;
export const STAY_HISTORY_PAGE_SIZE = 5;

function requirePage(page: number) {
  if (!Number.isInteger(page) || page < 1 || page > 100_000)
    throw new ApiRequestError(
      '조회할 페이지를 확인해 주세요.',
      400,
      'INVALID_STAY_PAGE',
    );
}

export async function getAdminStays(
  input: GetAdminStaysInput,
  token: string,
  signal?: AbortSignal,
): Promise<AdminStayListDto> {
  requirePage(input.page);
  if (
    (input.search !== undefined &&
      (typeof input.search !== 'string' ||
        [...input.search.trim()].length > 100)) ||
    (input.status !== undefined &&
      input.status !== 'ACTIVE' &&
      input.status !== 'CANCELLED')
  )
    throw new ApiRequestError(
      '이용 일정 검색 조건을 확인해 주세요.',
      400,
      'INVALID_STAY_FILTER',
    );
  const propertyId =
    input.propertyId === undefined
      ? undefined
      : requireStayId(input.propertyId);
  const query = new URLSearchParams({
    page: String(input.page),
    limit: String(STAY_LIST_PAGE_SIZE),
  });
  if (input.search?.trim()) query.set('search', input.search.trim());
  if (propertyId !== undefined) query.set('propertyId', propertyId);
  if (input.status !== undefined) query.set('status', input.status);
  const value = await apiRequest<unknown>(`/admin/stays?${query}`, {
    token,
    signal,
  });
  const result = readStayPage(value, input.page, STAY_LIST_PAGE_SIZE, (item) =>
    readStay(item),
  );
  if (
    new Set(result.items.map((item) => item.id)).size !== result.items.length ||
    result.items.some(
      (item) =>
        (propertyId !== undefined && item.propertyId !== propertyId) ||
        (input.status !== undefined && item.status !== input.status),
    ) ||
    result.items.some((item, index, items) => {
      if (index === 0) return false;
      const previous = items[index - 1];
      return (
        Date.parse(previous.checkInAt) > Date.parse(item.checkInAt) ||
        (previous.checkInAt === item.checkInAt && previous.id >= item.id)
      );
    })
  )
    throw invalidStayResponse();
  return result;
}

async function changeAdminStayStatus(
  action: 'cancel' | 'restore',
  id: string,
  input: ChangeAdminStayStatusInput,
  token: string,
  signal?: AbortSignal,
): Promise<AdminStayDto> {
  const stayId = requireStayId(id);
  if (!isStayRevision(input.expectedRevision))
    throw new ApiRequestError(
      '최신 이용 일정을 불러온 뒤 다시 시도해 주세요.',
      400,
      'INVALID_STAY_REVISION',
    );
  if (
    typeof input.reason !== 'string' ||
    !input.reason.trim() ||
    [...input.reason.trim()].length > 1000
  )
    throw new ApiRequestError(
      '사유를 1자 이상 1000자 이하로 입력해 주세요.',
      400,
      'INVALID_STAY_REASON',
    );
  const reason = input.reason.trim();
  const value = await apiRequest<unknown>(`/admin/stays/${stayId}/${action}`, {
    method: 'POST',
    token,
    signal,
    body: { expectedRevision: input.expectedRevision, reason },
  });
  const stay = readStay(value, stayId);
  if (
    stay.currentRevision !== input.expectedRevision + 1 ||
    (action === 'cancel'
      ? stay.status !== 'CANCELLED' || stay.cancellationReason !== reason
      : stay.status !== 'ACTIVE')
  )
    throw invalidStayResponse();
  return stay;
}

export function cancelAdminStay(
  id: string,
  input: ChangeAdminStayStatusInput,
  token: string,
  signal?: AbortSignal,
): Promise<AdminStayDto> {
  return changeAdminStayStatus('cancel', id, input, token, signal);
}

export function restoreAdminStay(
  id: string,
  input: ChangeAdminStayStatusInput,
  token: string,
  signal?: AbortSignal,
): Promise<AdminStayDto> {
  return changeAdminStayStatus('restore', id, input, token, signal);
}

export async function getAdminStayHistory(
  id: string,
  page: number,
  token: string,
  signal?: AbortSignal,
): Promise<AdminStayRevisionListDto> {
  const stayId = requireStayId(id);
  requirePage(page);
  const query = new URLSearchParams({
    page: String(page),
    limit: String(STAY_HISTORY_PAGE_SIZE),
  });
  const value = await apiRequest<unknown>(
    `/admin/stays/${stayId}/history?${query}`,
    { token, signal },
  );
  const result = readStayPage(value, page, STAY_HISTORY_PAGE_SIZE, (item) =>
    readStayRevision(item, stayId),
  );
  if (
    new Set(result.items.map((item) => item.id)).size !== result.items.length ||
    result.items.some(
      (item, index, items) =>
        index > 0 && items[index - 1].version <= item.version,
    )
  )
    throw invalidStayResponse();
  return result;
}
