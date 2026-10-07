import { useEffect, useId, useRef, useState } from 'react';
import type { AdminIssueRecordDto } from '../../../../features/admin-issues/admin-issues.types';
import type { IssueLifecycleAction } from '../../../../features/admin-issues/admin-issue-lifecycle.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { issueLifecyclePresentation } from '../model/issue-lifecycle-model';
import { issueStatusLabel } from '../model/issue-presentation';

export function IssueLifecycleConfirmation({
  issue,
  action,
  reason,
  busy,
  blocked,
  onBack,
  onConfirm,
}: {
  issue: AdminIssueRecordDto;
  action: IssueLifecycleAction;
  reason: string;
  busy: boolean;
  blocked: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const headingId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const copy = issueLifecyclePresentation(action);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  return (
    <section
      className="issue-lifecycle-confirmation"
      aria-labelledby={headingId}
    >
      <h3 id={headingId} ref={heading} tabIndex={-1}>
        {copy.title} 내용을 확인해 주세요
      </h3>
      <p className="issue-lifecycle-subject">{issue.title}</p>
      <dl className="issue-lifecycle-summary">
        <div>
          <dt>취소 여부</dt>
          <dd>
            {action === 'cancel'
              ? '취소되지 않음 → 취소됨'
              : '취소됨 → 취소되지 않음'}
          </dd>
        </div>
        <div>
          <dt>유지되는 처리 상태</dt>
          <dd>{issueStatusLabel(issue.status)}</dd>
        </div>
        <div>
          <dt>{copy.reasonLabel}</dt>
          <dd className="issue-detail-text">{reason}</dd>
        </div>
      </dl>
      <div className="issue-lifecycle-consequences">
        <p>{copy.consequence}</p>
        <p>
          <strong>신고 취소는 해결 처리와 다릅니다.</strong> 해결은 문제를
          고쳤을 때, 다시 조치는 해결된 같은 문제를 이어서 처리할 때 사용합니다.
        </p>
        <p>
          최초 신고·사진·모든 이력과 현재 긴급도·설명·해결 정보·이전 이상사항
          연결은 그대로 보존됩니다.
        </p>
        <p>
          출처 체크리스트·이용 일정·연결된 이전 신고와 다른 신고는 변경되지
          않습니다. 사진 파일도 삭제하지 않습니다.
        </p>
        {action === 'restore' && (
          <p>
            현재 저장된 내용을 유지하며 취소 표시만 해제합니다. 과거 버전으로
            되돌리거나 해결된 신고를 다시 조치 중으로 바꾸지 않습니다.
          </p>
        )}
      </div>
      {!blocked && (
        <>
          <label className="issue-lifecycle-check">
            <input
              type="checkbox"
              checked={confirmed}
              disabled={busy}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            <span>
              {copy.title} 사유와 처리 상태·사진·관련 기록 안내를 확인했습니다.
            </span>
          </label>
          <div className="issue-action-buttons">
            <Button
              className="admin-button-secondary"
              disabled={busy}
              onClick={onBack}
            >
              사유 다시 작성
            </Button>
            <Button
              className={
                action === 'cancel' ? 'issue-lifecycle-danger' : undefined
              }
              disabled={busy || !confirmed}
              loading={busy}
              onClick={() => {
                if (confirmed && !busy && !blocked) onConfirm();
              }}
            >
              {copy.confirmLabel}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
