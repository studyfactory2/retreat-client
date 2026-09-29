import { ApiRequestError } from '../../core/api/api-error';
import type {
  AddAdminIssueNoteInput,
  ChangeAdminIssueStatusInput,
  IssueStatus,
} from './admin-issues.types';

function requireActionVersion(expectedVersion: number): void {
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
