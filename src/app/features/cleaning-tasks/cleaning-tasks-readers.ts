import { ApiRequestError } from '../../core/api/api-error';
import {
  isStaffEntryId,
  isStaffEntryVersion,
} from '../staff-entry/staff-entry-validation';
import { isStaffDraftTimestamp } from '../staff-drafts/staff-drafts-validation';
import type {
  CleaningTaskDto,
  CleaningTaskListDto,
  TaskPasswordDto,
} from './cleaning-tasks.types';

export function invalidTaskResponse(): ApiRequestError {
  return new ApiRequestError(
    '정비 작업 응답을 확인할 수 없습니다. 다시 불러와 주세요.',
    200,
    'INVALID_CLEANING_TASK_RESPONSE',
  );
}
export function taskObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw invalidTaskResponse();
  return value as Record<string, unknown>;
}
function text(value: unknown, max: number): value is string {
  return (
    typeof value === 'string' && value.length > 0 && [...value].length <= max
  );
}
export function readCleaningTask(value: unknown): CleaningTaskDto {
  const t = taskObject(value);
  const p = taskObject(t.property);
  const s = t.departingStay === null ? null : taskObject(t.departingStay);
  if (
    !isStaffEntryId(t.id) ||
    !isStaffEntryId(p.id) ||
    !text(p.name, 100) ||
    (p.staffUserId !== null && !isStaffEntryId(p.staffUserId)) ||
    (p.staffName !== null && !text(p.staffName, 100)) ||
    !['AUTO', 'MANUAL'].includes(String(t.source)) ||
    !['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(
      String(t.status),
    ) ||
    !isStaffDraftTimestamp(t.dueAt) ||
    !isStaffEntryVersion(t.version) ||
    (t.currentSubmissionId !== null &&
      !isStaffEntryId(t.currentSubmissionId)) ||
    (t.completedAt !== null && !isStaffDraftTimestamp(t.completedAt)) ||
    (t.note !== null && !text(t.note, 500)) ||
    typeof t.canStart !== 'boolean' ||
    typeof t.requiresReview !== 'boolean' ||
    (s !== null &&
      (!isStaffEntryId(s.id) ||
        !isStaffDraftTimestamp(s.checkOutAt) ||
        !isStaffEntryVersion(s.currentRevision) ||
        !['ACTIVE', 'CANCELLED'].includes(String(s.status))))
  )
    throw invalidTaskResponse();
  return {
    id: t.id,
    property: {
      id: p.id,
      name: p.name,
      staffUserId: p.staffUserId,
      staffName: p.staffName,
    },
    departingStay: s as CleaningTaskDto['departingStay'],
    source: t.source as CleaningTaskDto['source'],
    status: t.status as CleaningTaskDto['status'],
    dueAt: t.dueAt,
    version: t.version,
    currentSubmissionId: t.currentSubmissionId,
    completedAt: t.completedAt,
    note: t.note,
    canStart: t.canStart,
    requiresReview: t.requiresReview,
  };
}
export function readCleaningTaskList(value: unknown): CleaningTaskListDto {
  const list = taskObject(value);
  if (
    !Array.isArray(list.items) ||
    list.items.length > 100 ||
    ![list.total, list.page, list.limit, list.totalPages].every(
      (v) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0,
    ) ||
    Number(list.page) < 1 ||
    Number(list.limit) < 1
  )
    throw invalidTaskResponse();
  const items = list.items.map(readCleaningTask);
  if (new Set(items.map((item) => item.id)).size !== items.length)
    throw invalidTaskResponse();
  return {
    items,
    total: Number(list.total),
    page: Number(list.page),
    limit: Number(list.limit),
    totalPages: Number(list.totalPages),
  };
}
export function readTaskPassword(
  value: unknown,
  taskId: string,
): TaskPasswordDto {
  const p = taskObject(value);
  if (
    p.taskId !== taskId ||
    typeof p.fingerprint !== 'string' ||
    !/^[a-f0-9]{64}$/i.test(p.fingerprint) ||
    !['NEXT_STAY', 'VACANCY', 'FIXED', 'BLOCKED'].includes(String(p.kind)) ||
    typeof p.canComplete !== 'boolean' ||
    typeof p.requiresChange !== 'boolean' ||
    (p.blockedReason !== null && !text(p.blockedReason, 500)) ||
    (p.nextCheckInAt !== null && !isStaffDraftTimestamp(p.nextCheckInAt))
  )
    throw invalidTaskResponse();
  return {
    taskId,
    fingerprint: p.fingerprint,
    kind: p.kind as TaskPasswordDto['kind'],
    canComplete: p.canComplete,
    blockedReason: p.blockedReason,
    nextCheckInAt: p.nextCheckInAt,
    requiresChange: p.requiresChange,
  };
}
