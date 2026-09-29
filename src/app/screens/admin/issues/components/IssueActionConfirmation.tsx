import { useEffect, useId, useRef } from 'react';
import type { AdminIssueRecordDto } from '../../../../features/admin-issues/admin-issues.types';
import { Button } from '../../../../shared/ui/Button/Button';
import type { IssueActionCommand } from '../model/issue-action-model';
import { issueStatusLabel } from '../model/issue-presentation';

type Confirmation =
  | { kind: 'reset' }
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
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panel.current?.focus();
  }, []);
  return (
    <div
      className="issue-action-confirmation"
      role="alertdialog"
      aria-labelledby={titleId}
      tabIndex={-1}
      ref={panel}
    >
      <h3 id={titleId}>
        {confirmation.kind === 'reset'
          ? '입력한 내용을 초기화할까요?'
          : '처리 상태를 변경할까요?'}
      </h3>
      {confirmation.kind === 'reset' ? (
        <p>선택한 처리 방법과 아직 저장하지 않은 메모가 초기화됩니다.</p>
      ) : (
        <>
          <p className="issue-action-confirmation__subject">
            {issue.property.name} · {issue.title}
          </p>
          <p className="issue-action-confirmation__transition">
            {issueStatusLabel(issue.status)} <span aria-hidden="true">→</span>
            <span className="issue-action-sr-only">에서</span>{' '}
            {issueStatusLabel(confirmation.command.status)}
            <span className="issue-action-sr-only">으로 변경</span>
          </p>
          <div className="issue-action-confirmation__note">
            <strong>저장할 메모</strong>
            <p>{confirmation.command.note || '작성하지 않음 (선택 항목)'}</p>
          </div>
          <p>상태 변경과 메모가 처리 이력에 저장됩니다.</p>
        </>
      )}
      <div className="issue-action-buttons">
        <Button
          className="admin-button-secondary"
          disabled={busy}
          onClick={onCancel}
        >
          {confirmation.kind === 'reset' ? '계속 작성' : '내용 다시 확인'}
        </Button>
        <Button loading={busy} onClick={onConfirm}>
          {confirmation.kind === 'reset' ? '입력 초기화' : '상태 변경 저장'}
        </Button>
      </div>
    </div>
  );
}
