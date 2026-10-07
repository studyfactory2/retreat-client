import { ApiRequestError } from '../../../../core/api/api-error';
import {
  prepareIssueNote,
  prepareIssueStatus,
  prepareIssueUrgency,
  prepareIssueRecurrence,
} from '../../../../features/admin-issues/admin-issue-action-validation';
import type {
  AdminIssueRecordDto,
  IssueStatus,
} from '../../../../features/admin-issues/admin-issues.types';

export type IssueActionCommand =
  | { kind: 'note'; note: string }
  | { kind: 'status'; status: 'IN_PROGRESS' | 'RESOLVED'; note: string }
  | { kind: 'urgency'; isUrgent: boolean; note: string }
  | { kind: 'recurrence'; recurrenceOfIssueId: string | null; note: string }
  | { kind: 'cancel'; reason: string }
  | { kind: 'restore'; reason: string };

export type IssueActionMutation = {
  status: 'idle' | 'saving' | 'error' | 'conflict' | 'unknown';
  message?: string;
};

export type IssueActionSelection = 'NOTE' | 'IN_PROGRESS' | 'RESOLVED';
export type IssueActionError = { field: 'action' | 'note'; message: string };

export function issueActionOptions(status: IssueStatus): {
  value: IssueActionSelection;
  label: string;
  description: string;
}[] {
  const options: ReturnType<typeof issueActionOptions> = [
    {
      value: 'NOTE',
      label: '메모 추가',
      description: '현재 처리 상태를 유지하며 확인한 내용을 남깁니다.',
    },
  ];
  if (status === 'NEW')
    options.push({
      value: 'IN_PROGRESS',
      label: '조치 시작',
      description: '처리 상태를 조치 중으로 변경합니다.',
    });
  if (status !== 'RESOLVED')
    options.push({
      value: 'RESOLVED',
      label: '해결 처리',
      description: '해결한 내용과 함께 처리 완료를 기록합니다.',
    });
  if (status === 'RESOLVED')
    options.push({
      value: 'IN_PROGRESS',
      label: '다시 조치',
      description: '다시 확인하는 사유를 남기고 조치 중으로 변경합니다.',
    });
  return options;
}

export function issueActionNoteRequired(
  status: IssueStatus,
  selection: IssueActionSelection,
): boolean {
  return (
    selection === 'NOTE' || selection === 'RESOLVED' || status === 'RESOLVED'
  );
}

export function issueActionNoteLabel(
  status: IssueStatus,
  selection: IssueActionSelection,
): string {
  if (selection === 'RESOLVED') return '해결 내용';
  if (status === 'RESOLVED' && selection === 'IN_PROGRESS')
    return '다시 확인하는 사유';
  return '처리 메모';
}

export function prepareIssueAction(
  issue: AdminIssueRecordDto,
  selection: IssueActionSelection,
  rawNote: string,
):
  | {
      command: Extract<IssueActionCommand, { kind: 'note' | 'status' }>;
      error?: never;
    }
  | { command?: never; error: IssueActionError } {
  if (issue.cancelledAt !== null)
    return {
      error: {
        field: 'action',
        message: '취소된 이상사항은 변경할 수 없습니다.',
      },
    };
  if (
    !issueActionOptions(issue.status).some(
      (option) => option.value === selection,
    )
  )
    return {
      error: {
        field: 'action',
        message: '현재 상태에서 가능한 처리 방법을 다시 선택해 주세요.',
      },
    };
  try {
    const note = rawNote.trim();
    if (selection === 'NOTE') {
      const prepared = prepareIssueNote({
        expectedVersion: issue.currentVersion,
        note,
      });
      return { command: { kind: 'note', note: prepared.note } };
    }
    const prepared = prepareIssueStatus(
      {
        expectedVersion: issue.currentVersion,
        status: selection,
        ...(note ? { note } : {}),
      },
      issue.status,
    );
    return {
      command: {
        kind: 'status',
        status: prepared.status,
        note: prepared.note ?? '',
      },
    };
  } catch (error: unknown) {
    return {
      error: {
        field:
          error instanceof ApiRequestError &&
          error.code === 'INVALID_ISSUE_NOTE'
            ? 'note'
            : 'action',
        message:
          error instanceof ApiRequestError
            ? error.message
            : '처리 방법과 입력 내용을 확인해 주세요.',
      },
    };
  }
}

export function prepareIssueManagementAction(
  issue: AdminIssueRecordDto,
  command: Extract<IssueActionCommand, { kind: 'urgency' | 'recurrence' }>,
):
  | {
      command: Extract<IssueActionCommand, { kind: 'urgency' | 'recurrence' }>;
      error?: never;
    }
  | { command?: never; error: IssueActionError } {
  if (issue.cancelledAt !== null)
    return {
      error: {
        field: 'action',
        message: '취소된 이상사항은 변경할 수 없습니다.',
      },
    };
  if (
    (command.kind === 'urgency' && command.isUrgent === issue.isUrgent) ||
    (command.kind === 'recurrence' &&
      command.recurrenceOfIssueId === issue.recurrenceOfIssueId)
  )
    return {
      error: { field: 'action', message: '변경할 내용을 선택해 주세요.' },
    };
  try {
    const input = { ...command, expectedVersion: issue.currentVersion };
    const prepared =
      command.kind === 'urgency'
        ? prepareIssueUrgency({
            expectedVersion: input.expectedVersion,
            isUrgent: command.isUrgent,
            note: command.note,
          })
        : prepareIssueRecurrence({
            expectedVersion: input.expectedVersion,
            recurrenceOfIssueId: command.recurrenceOfIssueId,
            note: command.note,
          });
    return { command: { ...command, note: prepared.note } };
  } catch (error: unknown) {
    return {
      error: {
        field:
          error instanceof ApiRequestError &&
          error.code === 'INVALID_ISSUE_NOTE'
            ? 'note'
            : 'action',
        message:
          error instanceof ApiRequestError
            ? error.message
            : '변경 내용과 사유를 확인해 주세요.',
      },
    };
  }
}

export function issueActionSavedMessage(
  command: IssueActionCommand,
  previousStatus: IssueStatus,
): string {
  if (command.kind === 'cancel' || command.kind === 'restore')
    return command.kind === 'cancel'
      ? '신고 취소 처리를 확인했습니다.'
      : '신고 복원 처리를 확인했습니다.';
  if (command.kind === 'note') return '메모를 저장했습니다.';
  if (command.kind === 'urgency')
    return command.isUrgent
      ? '긴급한 이상사항으로 변경했습니다.'
      : '긴급 표시를 해제했습니다.';
  if (command.kind === 'recurrence')
    return command.recurrenceOfIssueId
      ? '이전 이상사항 연결을 저장했습니다.'
      : '이전 이상사항 연결을 해제했습니다.';
  if (command.status === 'RESOLVED') return '해결 처리했습니다.';
  return previousStatus === 'RESOLVED'
    ? '다시 조치 중으로 변경했습니다.'
    : '조치를 시작했습니다.';
}
