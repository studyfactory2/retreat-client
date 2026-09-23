import { apiRequest } from '../../core/api/api-client';
import { ApiRequestError } from '../../core/api/api-error';
import {
  isDashboardDate,
  isDashboardPropertyId,
} from './admin-dashboard-filters';
import type {
  AdminDashboardDto,
  AdminDashboardInput,
  DashboardChecklistCounts,
} from './admin-dashboard.types';

function invalidResponse(): ApiRequestError {
  return new ApiRequestError(
    '운영 현황을 확인할 수 없습니다. 다시 조회해 주세요.',
    200,
    'INVALID_DASHBOARD_RESPONSE',
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readCounts<Key extends string>(
  value: unknown,
  keys: readonly Key[],
): Record<Key, number> {
  if (!isRecord(value)) throw invalidResponse();
  return Object.fromEntries(
    keys.map((key) => {
      const count = value[key];
      if (
        typeof count !== 'number' ||
        !Number.isSafeInteger(count) ||
        count < 0
      )
        throw invalidResponse();
      return [key, count];
    }),
  ) as Record<Key, number>;
}

function readChecklist(value: unknown): DashboardChecklistCounts {
  const counts = readCounts(value, [
    'scheduled',
    'notSubmitted',
    'submitted',
    'needsReview',
    'total',
  ]);
  if (
    counts.scheduled +
      counts.notSubmitted +
      counts.submitted +
      counts.needsReview !==
    counts.total
  )
    throw invalidResponse();
  return counts;
}

function readDashboard(
  value: unknown,
  requestedDate: string | undefined,
): AdminDashboardDto {
  if (
    !isRecord(value) ||
    typeof value.date !== 'string' ||
    !isDashboardDate(value.date) ||
    typeof value.today !== 'string' ||
    !isDashboardDate(value.today) ||
    value.timezone !== 'Asia/Seoul' ||
    typeof value.asOf !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.asOf) ||
    !isRecord(value.checklists) ||
    !isRecord(value.maintenance)
  )
    throw invalidResponse();

  const asOfTime = Date.parse(value.asOf);
  if (
    !Number.isFinite(asOfTime) ||
    new Date(asOfTime).toISOString() !== value.asOf ||
    new Date(asOfTime + 9 * 60 * 60 * 1_000).toISOString().slice(0, 10) !==
      value.today ||
    value.date !== (requestedDate ?? value.today)
  )
    throw invalidResponse();

  const stays = readCounts(value.stays, ['arrivals', 'departures']);
  const checklists = {
    checkIn: readChecklist(value.checklists.checkIn),
    checkOut: readChecklist(value.checklists.checkOut),
  };
  const unfinished = readCounts(value.maintenance.unfinished, [
    'total',
    'resumable',
    'expired',
    'accessBlocked',
    'needsReview',
  ]);
  const maintenance = {
    ...readCounts(value.maintenance, [
      'started',
      'completed',
      'completionNeedsReview',
    ]),
    unfinished,
  };
  const issues = readCounts(value.issues, ['new', 'inProgress', 'total']);
  if (
    checklists.checkIn.total !== stays.arrivals ||
    checklists.checkOut.total !== stays.departures ||
    unfinished.resumable +
      unfinished.expired +
      unfinished.accessBlocked +
      unfinished.needsReview !==
      unfinished.total ||
    issues.new + issues.inProgress !== issues.total
  )
    throw invalidResponse();

  return {
    date: value.date,
    today: value.today,
    timezone: 'Asia/Seoul',
    asOf: value.asOf,
    stays,
    checklists,
    maintenance,
    issues,
  };
}

export async function getAdminDashboard(
  input: AdminDashboardInput,
  token: string,
  signal?: AbortSignal,
): Promise<AdminDashboardDto> {
  if (
    (input.date !== undefined && !isDashboardDate(input.date)) ||
    (input.propertyId !== undefined && !isDashboardPropertyId(input.propertyId))
  ) {
    throw new ApiRequestError(
      '조회 날짜와 휴양소를 확인해 주세요.',
      400,
      'INVALID_DASHBOARD_FILTER',
    );
  }
  const query = new URLSearchParams();
  if (input.date !== undefined) query.set('date', input.date);
  if (input.propertyId !== undefined)
    query.set('propertyId', input.propertyId.toLowerCase());
  const suffix = query.size ? `?${query.toString()}` : '';
  const value = await apiRequest<unknown>(`/admin/dashboard${suffix}`, {
    token,
    signal,
  });
  return readDashboard(value, input.date);
}
