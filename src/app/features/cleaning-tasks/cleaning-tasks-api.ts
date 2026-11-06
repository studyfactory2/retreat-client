import { apiRequest } from '../../core/api/api-client';
import { appConfig } from '../../core/config/environment';
import { readStaffDraft } from '../staff-drafts/staff-drafts-readers';
import {
  isStaffDraftToken,
  requireStaffDraftToken,
} from '../staff-drafts/staff-drafts-validation';
import { requireStaffQrToken } from '../staff-entry/staff-entry-validation';
import type { StartStaffDraftDto } from '../staff-drafts/staff-drafts.types';
import {
  invalidTaskResponse,
  readCleaningTask,
  readCleaningTaskList,
  readStaffCompletionList,
  readTaskPassword,
  taskObject,
} from './cleaning-tasks-readers';
import type { CleaningTaskStatus } from './cleaning-tasks.types';

export async function getAdminCleaningTasks(
  token: string,
  filters: { propertyId?: string; status?: CleaningTaskStatus; page: number },
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({
    page: String(filters.page),
    limit: '20',
  });
  if (filters.propertyId) query.set('propertyId', filters.propertyId);
  if (filters.status) query.set('status', filters.status);
  return readCleaningTaskList(
    await apiRequest<unknown>(`/admin/cleaning-tasks?${query}`, {
      token,
      signal,
    }),
  );
}
export async function createCleaningTask(
  token: string,
  input: {
    requestKey: string;
    propertyId: string;
    dueAt: string;
    note?: string;
  },
) {
  return readCleaningTask(
    await apiRequest<unknown>('/admin/cleaning-tasks', {
      token,
      method: 'POST',
      body: input,
    }),
  );
}
export async function updateCleaningTask(
  token: string,
  id: string,
  input: { expectedVersion: number; dueAt: string; note: string | null },
) {
  return readCleaningTask(
    await apiRequest<unknown>(`/admin/cleaning-tasks/${id}/update`, {
      token,
      method: 'POST',
      body: input,
    }),
  );
}
export async function cancelCleaningTask(
  token: string,
  id: string,
  expectedVersion: number,
  reason: string,
) {
  return readCleaningTask(
    await apiRequest<unknown>(`/admin/cleaning-tasks/${id}/cancel`, {
      token,
      method: 'POST',
      body: { expectedVersion, reason },
    }),
  );
}
export async function syncAdminCleaningTasks(
  token: string,
  propertyId?: string,
) {
  const result = taskObject(
    await apiRequest<unknown>('/admin/cleaning-tasks/sync', {
      token,
      method: 'POST',
      body: propertyId ? { propertyId } : {},
    }),
  );
  if (
    ![result.created, result.updated].every(
      (v) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0,
    )
  )
    throw invalidTaskResponse();
}
export async function getStaffCleaningTasks(
  token: string,
  sync: boolean,
  signal?: AbortSignal,
  page = 1,
  completed = false,
) {
  requireStaffQrToken(token);
  const result = sync
    ? await apiRequest<unknown>('/staff/cleaning-tasks/sync', {
        token,
        signal,
        method: 'POST',
        body: {
          page,
          limit: 20,
          ...(completed ? { status: 'COMPLETED' } : {}),
        },
      })
    : await apiRequest<unknown>(
        `/staff/cleaning-tasks?page=${page}&limit=20${completed ? '&status=COMPLETED' : ''}`,
        { token, signal },
      );
  return readCleaningTaskList(result);
}
export async function getStaffCompletions(
  token: string,
  page: number,
  signal: AbortSignal,
) {
  requireStaffQrToken(token);
  return readStaffCompletionList(
    await apiRequest<unknown>(
      `/staff/cleaning-tasks/completed?page=${page}&limit=20`,
      { token, signal },
    ),
  );
}
export async function startCleaningTask(
  token: string,
  taskId: string,
  propertyId: string,
  confirmedStaffId: string,
  expectedVersion: number,
  signal?: AbortSignal,
): Promise<StartStaffDraftDto> {
  requireStaffQrToken(token);
  const result = taskObject(
    await apiRequest<unknown>(`/staff/cleaning-tasks/${taskId}/start`, {
      token,
      signal,
      method: 'POST',
      body: { confirmedStaffId, expectedVersion },
    }),
  );
  const draft = readStaffDraft(result.draft);
  if (
    !isStaffDraftToken(result.accessToken) ||
    result.expiresAt !== draft.expiresAt ||
    result.url !==
      `${appConfig.frontendOrigin}/draft#token=${result.accessToken}` ||
    draft.property.id !== propertyId ||
    draft.cleaningTask?.id !== taskId
  )
    throw invalidTaskResponse();
  return {
    draft,
    accessToken: result.accessToken,
    expiresAt: draft.expiresAt,
    url: result.url,
  };
}
export async function getTaskPassword(
  token: string,
  taskId: string,
  signal?: AbortSignal,
) {
  requireStaffDraftToken(token);
  return readTaskPassword(
    await apiRequest<unknown>('/submission-drafts/task-password', {
      token,
      signal,
    }),
    taskId,
  );
}
export async function revealTaskPassword(
  token: string,
  fingerprint: string,
  signal?: AbortSignal,
) {
  requireStaffDraftToken(token);
  const result = taskObject(
    await apiRequest<unknown>('/submission-drafts/task-password/reveal', {
      token,
      signal,
      method: 'POST',
      body: { fingerprint },
    }),
  );
  if (
    result.fingerprint !== fingerprint ||
    typeof result.code !== 'string' ||
    !/^[0-9*#]{1,32}$/.test(result.code)
  )
    throw invalidTaskResponse();
  return result.code;
}
