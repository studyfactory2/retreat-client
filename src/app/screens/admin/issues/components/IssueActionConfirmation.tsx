import { useEffect, useId, useRef } from 'react';
import type { AdminIssueRecordDto } from '../../../../features/admin-issues/admin-issues.types';
import { Button } from '../../../../shared/ui/Button/Button';
import type { IssueActionCommand } from '../model/issue-action-model';
import { issueStatusLabel, issueStatusTone } from '../model/issue-presentation';

type Confirmation =
  | { kind: 'reset' }
  | { kind: 'note'; command: Extract<IssueActionCommand, { kind: 'note' }> }
  | {
      kind: 'status';
      command: Extract<IssueActionCommand, { kind: 'status' }>;
    };
export type IssueActionConfirmationState = Confirmation;

export function IssueActionConfirmation({
  issue,
  confirmation,
  busy,
  onConfirm,
  onCancel,
}: {
  issue: AdminIssueRecordDto;
  confirmation: Confirmation;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const title =
    confirmation.kind === 'reset'
      ? '입력한 내용을 초기화할까요?'
      : confirmation.kind === 'note'
        ? '메모를 저장할까요?'
        : confirmation.command.status === 'RESOLVED'
          ? '해결 완료로 변경할까요?'
          : issue.status === 'RESOLVED'
            ? '다시 조치할까요?'
            : '조치를 시작할까요?';
  const confirmLabel =
    confirmation.kind === 'reset'
      ? '입력 초기화'
      : confirmation.kind === 'note'
        ? '메모 저장'
        : confirmation.command.status === 'RESOLVED'
          ? '해결 완료'
          : issue.status === 'RESOLVED'
            ? '다시 조치'
            : '조치 시작';
  useEffect(() => {
    panel.current?.focus();
  }, []);
  return (
    <div
      className="issue-action-confirmation"
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      tabIndex={-1}
      ref={panel}
    >
      <h3 id={titleId}>{title}</h3>
      {confirmation.kind === 'reset' ? (
        <p id={descriptionId}>
          선택한 처리 방법과 아직 저장하지 않은 메모가 초기화됩니다.
        </p>
      ) : (
        <>
          <p className="issue-action-confirmation__subject">
            {issue.property.name} · {issue.title}
          </p>
          {confirmation.kind === 'status' && (
            <p className="issue-action-confirmation__transition">
              <span
                className={`issue-detail-badge issue-detail-badge--${issueStatusTone(issue.status)}`}
              >
                {issueStatusLabel(issue.status)}
              </span>
              <span aria-hidden="true">→</span>
              <span className="issue-action-sr-only">에서</span>
              <span
                className={`issue-detail-badge issue-detail-badge--${issueStatusTone(confirmation.command.status)}`}
              >
                {issueStatusLabel(confirmation.command.status)}
              </span>
              <span className="issue-action-sr-only">으로 변경</span>
            </p>
          )}
          <div className="issue-action-confirmation__note">
            <strong className="issue-action-sr-only">저장할 메모</strong>
            <p>{confirmation.command.note || '메모 없음'}</p>
          </div>
          <p id={descriptionId}>
            {confirmation.kind === 'note'
              ? '메모가 처리 이력에 저장됩니다.'
              : '처리 상태와 메모가 이력에 저장됩니다.'}
          </p>
        </>
      )}
      <div className="issue-action-buttons">
        <Button
          className="admin-button-secondary"
          disabled={busy}
          onClick={onCancel}
        >
          {confirmation.kind === 'reset' ? '계속 작성' : '다시 작성'}
        </Button>
        <Button loading={busy} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
