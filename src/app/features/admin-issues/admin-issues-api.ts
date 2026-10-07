import { apiRequest } from '../../core/api/api-client';
import { ApiRequestError } from '../../core/api/api-error';
import type {
  AdminIssueDetailDto,
  AdminIssueRecordDto,
  ChangeAdminIssueUrgencyInput,
  ChangeAdminIssueRecurrenceInput,
  AdminIssueFilters,
  AdminIssueHistoryDto,
  AdminIssueListDto,
  AdminIssuePhotoViewDto,
  AddAdminIssueNoteInput,
  ChangeAdminIssueStatusInput,
} from './admin-issues.types';
import { readIssueSummary } from './admin-issue-record-readers';
import {
  readIssueDetail,
  readIssueEvent,
  readIssuePhotoView,
  sameIssueSource,
} from './admin-issues-readers';
import {
  invalidIssueResponse,
  readIssuePage,
  requireIssueId,
  requireIssuePage,
  validateIssueFilters,
} from './admin-issues-validation';

import {
  prepareIssueNote,
  requireActionVersion,
  prepareIssueUrgency,
  prepareIssueRecurrence,
  prepareIssueStatus,
} from './admin-issue-action-validation';
import {
  readIssueNoteResult,
  readIssueUrgencyResult,
  readIssueRecurrenceResult,
  readIssueStatusResult,
} from './admin-issue-action-readers';

export const ISSUE_LIST_PAGE_SIZE = 20;
export const ISSUE_HISTORY_PAGE_SIZE = 5;

export async function getAdminIssues(
  filters: AdminIssueFilters,
  token: string,
  signal?: AbortSignal,
): Promise<AdminIssueListDto> {
  requireIssuePage(filters.page);
  const errors = validateIssueFilters(filters);
  if (Object.keys(errors).length)
    throw new ApiRequestError(
      Object.values(errors)[0] ?? '이상사항 조회 조건을 확인해 주세요.',
      400,
      'INVALID_ISSUE_FILTER',
    );
  const query = new URLSearchParams({
    page: String(filters.page),
    limit: String(ISSUE_LIST_PAGE_SIZE),
  });
  for (const key of [
    'propertyId',
    'status',
    'isUrgent',
    'cancellation',
    'from',
    'to',
  ] as const)
    if (filters[key] !== undefined)
      query.set(
        key,
        key === 'propertyId' ? filters[key].toLowerCase() : filters[key],
      );
  const value = await apiRequest<unknown>(`/admin/issues?${query}`, {
    token,
    signal,
  });
  const result = readIssuePage(
    value,
    filters.page,
    ISSUE_LIST_PAGE_SIZE,
    (item) => readIssueSummary(item, filters.cancellation !== undefined),
  );
  const from =
    filters.from === undefined
      ? undefined
      : Date.parse(`${filters.from}T00:00:00.000Z`) - 9 * 3_600_000;
  const to =
    filters.to === undefined
      ? undefined
      : Date.parse(`${filters.to}T00:00:00.000Z`) + 15 * 3_600_000;
  if (
    new Set(result.items.map((item) => item.id)).size !== result.items.length ||
    result.items.some((item, index, items) => {
      const previous = items[index - 1];
      const reportedAt = Date.parse(item.reportedAt);
      return (
        (filters.propertyId !== undefined &&
          item.property.id !== filters.propertyId.toLowerCase()) ||
        (filters.status !== undefined && item.status !== filters.status) ||
        ((filters.cancellation ?? 'active') === 'active' &&
          item.cancelledAt !== null) ||
        (filters.cancellation === 'cancelled' && item.cancelledAt === null) ||
        (filters.isUrgent !== undefined &&
          item.isUrgent !== (filters.isUrgent === 'true')) ||
        (from !== undefined && reportedAt < from) ||
        (to !== undefined && reportedAt >= to) ||
        (previous !== undefined &&
          (Date.parse(previous.reportedAt) < reportedAt ||
            (previous.reportedAt === item.reportedAt &&
              previous.id <= item.id)))
      );
    })
  )
    throw invalidIssueResponse();
  return result;
}

export async function getAdminIssue(
  id: string,
  token: string,
  signal?: AbortSignal,
): Promise<AdminIssueDetailDto> {
  const issueId = requireIssueId(id);
  return readIssueDetail(
    await apiRequest<unknown>(`/admin/issues/${issueId}`, { token, signal }),
    issueId,
  );
}

export async function getAdminIssueHistory(
  id: string,
  page: number,
  token: string,
  signal?: AbortSignal,
): Promise<AdminIssueHistoryDto> {
  const issueId = requireIssueId(id);
  requireIssuePage(page);
  const query = new URLSearchParams({
    page: String(page),
    limit: String(ISSUE_HISTORY_PAGE_SIZE),
  });
  const value = await apiRequest<unknown>(
    `/admin/issues/${issueId}/history?${query}`,
    { token, signal },
  );
  const result = readIssuePage(value, page, ISSUE_HISTORY_PAGE_SIZE, (item) =>
    readIssueEvent(item, issueId),
  );
  if (
    new Set(result.items.map((item) => item.id)).size !== result.items.length ||
    result.items.some((item, index, items) => {
      const previous = items[index - 1];
      return (
        previous !== undefined &&
        (previous.version <= item.version ||
          !sameIssueSource(previous.record, item.record))
      );
    })
  )
    throw invalidIssueResponse();
  return result;
}

export async function getAdminIssuePhotoView(
  issueId: string,
  eventId: string,
  photoId: string,
  token: string,
  signal?: AbortSignal,
): Promise<AdminIssuePhotoViewDto> {
  const issue = requireIssueId(issueId);
  const event = requireIssueId(eventId);
  const photo = requireIssueId(photoId);
  return readIssuePhotoView(
    await apiRequest<unknown>(
      `/admin/issues/${issue}/events/${event}/photos/${photo}/view`,
      { token, signal },
    ),
  );
}

export async function addAdminIssueNote(
  id: string,
  input: AddAdminIssueNoteInput,
  token: string,
  signal?: AbortSignal,
): Promise<AdminIssueDetailDto> {
  const issueId = requireIssueId(id);
  const body = prepareIssueNote(input);

  const response = await apiRequest<unknown>(`/admin/issues/${issueId}/notes`, {
    method: 'POST',
    token,
    signal,
    body: { expectedVersion: body.expectedVersion, note: body.note },
  });

  return readIssueNoteResult(response, issueId, body);
}

export async function changeAdminIssueStatus(
  id: string,
  input: ChangeAdminIssueStatusInput,
  token: string,
  signal?: AbortSignal,
): Promise<AdminIssueDetailDto> {
  const issueId = requireIssueId(id);
  const body = prepareIssueStatus(input);
  const response = await apiRequest<unknown>(
    `/admin/issues/${issueId}/status`,
    {
      method: 'POST',
      token,
      signal,
      body: {
        expectedVersion: body.expectedVersion,
        status: body.status,
        ...(body.note === undefined ? {} : { note: body.note }),
      },
    },
  );
  return readIssueStatusResult(response, issueId, body);
}

export const ISSUE_RECURRENCE_PAGE_SIZE = 5;

export async function getAdminIssueRecurrenceCandidates(
  issue: AdminIssueRecordDto,
  page: number,
  token: string,
  signal?: AbortSignal,
): Promise<AdminIssueListDto> {
  const issueId = requireIssueId(issue.id);
  requireIssuePage(page);
  requireActionVersion(issue.currentVersion);
  const query = new URLSearchParams({
    expectedVersion: String(issue.currentVersion),
    page: String(page),
    limit: String(ISSUE_RECURRENCE_PAGE_SIZE),
  });
  const response = await apiRequest<unknown>(
    `/admin/issues/${issueId}/recurrence-candidates?${query}`,
    { token, signal },
  );
  const result = readIssuePage(
    response,
    page,
    ISSUE_RECURRENCE_PAGE_SIZE,
    (item) => readIssueSummary(item),
  );
  if (
    new Set(result.items.map((item) => item.id)).size !== result.items.length ||
    result.totalPages > 100_000 ||
    result.items.some((item, index, items) => {
      const previous = items[index - 1];
      return (
        item.id === issueId ||
        item.cancelledAt !== null ||
        item.id === issue.recurrenceOfIssueId ||
        item.property.id !== issue.property.id ||
        Date.parse(item.reportedAt) >= Date.parse(issue.reportedAt) ||
        (previous !== undefined &&
          (Date.parse(previous.reportedAt) < Date.parse(item.reportedAt) ||
            (previous.reportedAt === item.reportedAt &&
              previous.id <= item.id)))
      );
    })
  )
    throw invalidIssueResponse();
  return result;
}

export async function changeAdminIssueUrgency(
  id: string,
  input: ChangeAdminIssueUrgencyInput,
  token: string,
  signal?: AbortSignal,
): Promise<AdminIssueDetailDto> {
  const issueId = requireIssueId(id);
  const body = prepareIssueUrgency(input);
  const response = await apiRequest<unknown>(
    `/admin/issues/${issueId}/urgency`,
    {
      method: 'POST',
      token,
      signal,
      body: { ...body },
    },
  );
  return readIssueUrgencyResult(response, issueId, body);
}

export async function changeAdminIssueRecurrence(
  id: string,
  input: ChangeAdminIssueRecurrenceInput,
  token: string,
  signal?: AbortSignal,
): Promise<AdminIssueDetailDto> {
  const issueId = requireIssueId(id);
  const body = prepareIssueRecurrence(input, issueId);
  const response = await apiRequest<unknown>(
    `/admin/issues/${issueId}/recurrence`,
    {
      method: 'POST',
      token,
      signal,
      body: { ...body },
    },
  );
  return readIssueRecurrenceResult(response, issueId, body);
}
