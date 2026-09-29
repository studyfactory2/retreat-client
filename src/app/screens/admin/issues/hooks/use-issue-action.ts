import { useEffect, useRef, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import {
  addAdminIssueNote,
  changeAdminIssueStatus,
} from '../../../../features/admin-issues/admin-issues-api';
import { prepareIssueStatus } from '../../../../features/admin-issues/admin-issue-action-validation';
import { verifyIssueActionReceipt } from '../../../../features/admin-issues/admin-issue-action-readers';
import type { AdminIssueDetailDto } from '../../../../features/admin-issues/admin-issues.types';
import type {
  IssueActionCommand,
  IssueActionMutation,
} from '../model/issue-action-model';

export function useIssueAction(
  detail: AdminIssueDetailDto,
  token: string,
  adminId: string,
  rejectSession: (token: string) => void,
  onSaved: (detail: AdminIssueDetailDto, command: IssueActionCommand) => void,
) {
  const scope = `${detail.issue.id}:${detail.issue.currentVersion}`;
  const pending = useRef<AbortController | null>(null);
  const blocked = useRef(false);
  const [result, setResult] = useState<{
    owner: string;
    scope: string;
    state: IssueActionMutation;
  }>();

  useEffect(() => {
    blocked.current = false;
    return () => {
      pending.current?.abort();
      pending.current = null;
    };
  }, [scope, token]);

  async function submit(command: IssueActionCommand) {
    if (pending.current || blocked.current || detail.issue.cancelledAt) return;
    const controller = new AbortController();
    pending.current = controller;
    setResult({ owner: token, scope, state: { status: 'saving' } });
    try {
      const input = {
        expectedVersion: detail.issue.currentVersion,
        note: command.note,
      };
      const receipt =
        command.kind === 'note'
          ? await addAdminIssueNote(
              detail.issue.id,
              input,
              token,
              controller.signal,
            )
          : await changeAdminIssueStatus(
              detail.issue.id,
              prepareIssueStatus(
                {
                  expectedVersion: input.expectedVersion,
                  status: command.status,
                  ...(command.note.trim() ? { note: command.note } : {}),
                },
                detail.issue.status,
              ),
              token,
              controller.signal,
            );
      if (controller.signal.aborted) return;
      verifyIssueActionReceipt(detail, receipt, adminId, command.kind);
      // A second click cannot send the old version while the parent installs the receipt.
      blocked.current = true;
      onSaved(receipt, command);
    } catch (error: unknown) {
      if (controller.signal.aborted) return;
      if (
        error instanceof ApiRequestError &&
        (error.status === 401 || error.status === 403)
      ) {
        blocked.current = true;
        rejectSession(token);
        return;
      }
      const conflict =
        error instanceof ApiRequestError &&
        (error.status === 409 ||
          error.status === 404 ||
          error.code === 'INVALID_ISSUE_VERSION');
      const uncertain =
        !(error instanceof ApiRequestError) ||
        error.status === null ||
        error.status >= 500 ||
        (error.status >= 200 && error.status < 300);
      blocked.current = conflict || uncertain;
      setResult({
        owner: token,
        scope,
        state: {
          status: conflict ? 'conflict' : uncertain ? 'unknown' : 'error',
          message: uncertain
            ? '저장 결과를 확인하지 못했습니다. 이미 반영되었을 수 있으니 최신 내용과 처리 이력을 확인한 뒤 다시 진행해 주세요.'
            : conflict
              ? '이상사항이 변경되었거나 더 이상 처리할 수 없습니다. 최신 내용을 불러온 뒤 확인해 주세요.'
              : error instanceof ApiRequestError
                ? error.message
                : '처리 내용을 저장하지 못했습니다.',
        },
      });
    } finally {
      if (pending.current === controller) pending.current = null;
    }
  }

  return {
    submit,
    mutation:
      result?.owner === token && result.scope === scope
        ? result.state
        : ({ status: 'idle' } as IssueActionMutation),
  };
}
