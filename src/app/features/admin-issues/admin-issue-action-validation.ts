import { ApiRequestError } from '../../core/api/api-error';
import type {
  AddAdminIssueNoteInput,
  ChangeAdminIssueStatusInput,
  ChangeAdminIssueUrgencyInput,
  ChangeAdminIssueRecurrenceInput,
  IssueStatus,
} from './admin-issues.types';
import { requireIssueId } from './admin-issues-validation';

export function requireActionVersion(expectedVersion: number): void {
  if (
    !Number.isInteger(expectedVersion) ||
    expectedVersion < 1 ||
    expectedVersion > 2147483646
  ) {
    throw new ApiRequestError(
      '이상사항을 다시 불러온 뒤 시도해 주세요.',
      400,
      'INVALID_ISSUE_VERSION',
    );
  }
}

export const ISSUE_MANAGEMENT_REASON_LIMIT = 500;

function managementReason(value: unknown): string {
  const note = typeof value === 'string' ? value.trim() : '';
  if (!note || [...note].length > ISSUE_MANAGEMENT_REASON_LIMIT)
    throw new ApiRequestError(
      '변경 사유는 1자 이상 500자 이하로 입력해 주세요.',
      400,
      'INVALID_ISSUE_NOTE',
    );
  return note;
}

export function prepareIssueUrgency(
  input: ChangeAdminIssueUrgencyInput,
): ChangeAdminIssueUrgencyInput {
  requireActionVersion(input.expectedVersion);
  if (typeof input.isUrgent !== 'boolean')
    throw new ApiRequestError(
      '변경할 긴급 여부를 확인해 주세요.',
      400,
      'INVALID_ISSUE_URGENCY',
    );
  return {
    expectedVersion: input.expectedVersion,
    isUrgent: input.isUrgent,
    note: managementReason(input.note),
  };
}

export function prepareIssueRecurrence(
  input: ChangeAdminIssueRecurrenceInput,
  issueId?: string,
): ChangeAdminIssueRecurrenceInput {
  requireActionVersion(input.expectedVersion);
  const recurrenceOfIssueId =
    input.recurrenceOfIssueId === null
      ? null
      : requireIssueId(input.recurrenceOfIssueId);
  if (issueId !== undefined && recurrenceOfIssueId === requireIssueId(issueId))
    throw new ApiRequestError(
      '현재 이상사항을 이전 기록으로 연결할 수 없습니다.',
      400,
      'INVALID_ISSUE_RECURRENCE',
    );
  return {
    expectedVersion: input.expectedVersion,
    recurrenceOfIssueId,
    note: managementReason(input.note),
  };
}

function actionNote(value: unknown): string {
  const note = typeof value === 'string' ? value.trim() : '';
  if (!note || [...note].length > 2000) {
    throw new ApiRequestError(
      '메모는 1자 이상 2000자 이하로 입력해 주세요.',
      400,
      'INVALID_ISSUE_NOTE',
    );
  }
  return note;
}

export function prepareIssueNote(
  input: AddAdminIssueNoteInput,
): AddAdminIssueNoteInput {
  const { expectedVersion } = input;
  requireActionVersion(expectedVersion);
  return { expectedVersion, note: actionNote(input.note) };
}

export function prepareIssueStatus(
  input: ChangeAdminIssueStatusInput,
  currentStatus?: IssueStatus,
): ChangeAdminIssueStatusInput {
  const { expectedVersion, status } = input;
  requireActionVersion(expectedVersion);
  if (
    (status !== 'IN_PROGRESS' && status !== 'RESOLVED') ||
    (currentStatus !== undefined &&
      !['NEW', 'IN_PROGRESS', 'RESOLVED'].includes(currentStatus)) ||
    currentStatus === status
  ) {
    throw new ApiRequestError(
      '변경할 처리 상태를 확인해 주세요. 최신 기록을 확인한 뒤 다시 선택해 주세요.',
      400,
      'INVALID_ISSUE_STATUS',
    );
  }
  const note = input.note === undefined ? undefined : actionNote(input.note);
  if (
    note === undefined &&
    (status === 'RESOLVED' || currentStatus === 'RESOLVED')
  ) {
    throw new ApiRequestError(
      status === 'RESOLVED'
        ? '처리 완료 내용을 1자 이상 2000자 이하로 입력해 주세요.'
        : '다시 확인하는 이유를 1자 이상 2000자 이하로 입력해 주세요.',
      400,
      'INVALID_ISSUE_NOTE',
    );
  }
  return {
    expectedVersion,
    status,
    ...(note === undefined ? {} : { note }),
  };
}
