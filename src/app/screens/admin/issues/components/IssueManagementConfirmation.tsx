import { useEffect, useId, useRef } from 'react';
import type { AdminIssueRecordDto } from '../../../../features/admin-issues/admin-issues.types';
import { Button } from '../../../../shared/ui/Button/Button';
import type { IssueActionCommand } from '../model/issue-action-model';

type ManagementCommand = Extract<
  IssueActionCommand,
  { kind: 'urgency' | 'recurrence' }
>;
export function IssueManagementConfirmation({
  issue,
  command,
  selectedTitle,
  busy,
  locked = false,
  onConfirm,
  onCancel,
}: {
  issue: AdminIssueRecordDto;
  command: ManagementCommand;
  selectedTitle?: string;
  busy: boolean;
  locked?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panel.current?.focus();
  }, []);
  const label =
    command.kind === 'urgency'
      ? command.isUrgent
        ? '긴급으로 변경'
        : '긴급 해제'
      : command.recurrenceOfIssueId
        ? '이전 이상사항 연결'
        : '이전 이상사항 연결 해제';
  return (
    <div
      className="issue-action-confirmation"
      role="alertdialog"
      aria-labelledby={titleId}
      tabIndex={-1}
      ref={panel}
    >
      <h3 id={titleId}>{label} 내용을 저장할까요?</h3>
      <p className="issue-action-confirmation__subject">{issue.title}</p>
      <p className="issue-action-confirmation__transition">
        {command.kind === 'urgency'
          ? `${issue.isUrgent ? '긴급' : '일반'} → ${command.isUrgent ? '긴급' : '일반'}`
          : command.recurrenceOfIssueId
            ? selectedTitle
            : '연결 없음'}
      </p>
      <div className="issue-action-confirmation__note">
        <strong>변경 사유</strong>
        <p>{command.note}</p>
      </div>
      <p>
        {command.kind === 'urgency'
          ? '긴급 표시와 사유가 처리 이력에 저장됩니다. 알림은 발송되지 않습니다.'
          : '연결과 사유만 변경됩니다. 각 신고의 처리 상태와 최초 신고는 그대로 보존됩니다.'}
      </p>
      <div className="issue-action-buttons">
        <Button
          className="admin-button-secondary"
          disabled={busy}
          onClick={onCancel}
        >
          내용 다시 확인
        </Button>
        <Button loading={busy} disabled={locked} onClick={onConfirm}>
          변경 저장
        </Button>
      </div>
    </div>
  );
}
