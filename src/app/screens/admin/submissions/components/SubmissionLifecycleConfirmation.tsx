import { useEffect, useId, useRef, useState } from 'react';
import type { AdminSubmissionDetail } from '../../../../features/admin-submissions/admin-submissions.types';
import type {
  AdminSubmissionLifecycleAction,
  AdminSubmissionLifecycleInput,
} from '../../../../features/admin-submissions/admin-submission-lifecycle.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { submissionLifecyclePresentation } from '../model/submission-lifecycle-model';
import {
  submissionTime,
  submissionTypeLabel,
} from '../model/submission-detail-model';

export function SubmissionLifecycleConfirmation({
  detail,
  action,
  input,
  busy,
  blocked,
  onBack,
  onConfirm,
}: {
  detail: AdminSubmissionDetail;
  action: AdminSubmissionLifecycleAction;
  input: AdminSubmissionLifecycleInput;
  busy: boolean;
  blocked: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const headingId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const copy = submissionLifecyclePresentation(action);
  const record = detail.revision.record;
  useEffect(() => {
    heading.current?.focus();
  }, []);
  return (
    <section
      className="submission-lifecycle-confirmation"
      aria-labelledby={headingId}
    >
      <div className="submission-lifecycle-review-heading">
        <h3 id={headingId} ref={heading} tabIndex={-1}>
          {copy.title} 내용을 확인해 주세요
        </h3>
        <p className="submission-lifecycle-transition">{copy.transition}</p>
      </div>
      <dl className="submission-lifecycle-summary">
        <div>
          <dt>제출 기록</dt>
          <dd>
            {record.property.name} · {submissionTypeLabel(record.type)} ·{' '}
            {record.author.name}
          </dd>
        </div>
        <div>
          <dt>원래 제출 시각</dt>
          <dd>{submissionTime(record.submittedAt)}</dd>
        </div>
        <div>
          <dt>{copy.reasonLabel}</dt>
          <dd className="submission-detail-text">{input.reason}</dd>
        </div>
      </dl>
      <p className="submission-lifecycle-effect">{copy.operationalEffect}</p>
      <div className="submission-lifecycle-consequences">
        <h4>처리 범위</h4>
        <dl>
          <div>
            <dt>기록·사진</dt>
            <dd>
              답변·사진·원래 작성자·이용 일정 연결과 이전 이력은 유지됩니다.
              첨부 파일은 삭제되지 않습니다.
            </dd>
          </div>
          <div>
            <dt>이상사항</dt>
            <dd>
              긴급도·처리 상태·해결 정보·이전 이상사항 연결과 원래 증거는 그대로입니다.
              <strong> 자동으로 취소하거나 해결하지 않습니다.</strong>
              {action === 'cancel' && (
                <p>취소된 체크리스트를 출처로 한 이상사항도 계속 처리할 수 있습니다.</p>
              )}
            </dd>
          </div>
          {action === 'restore' && (
            <>
              <div>
                <dt>복원 범위</dt>
                <dd>
                  현재 저장된 답변과 사진만 유지합니다. 이전 정정에서 제외한
                  사진이나 직원 조치 정보는 복구되지 않습니다.
                </dd>
              </div>
              <div>
                <dt>일정·링크</dt>
                <dd>
                  원래 제출 시각을 유지하며, 이용 일정 상태와 접속 링크
                  유효기간은 바뀌지 않습니다.
                </dd>
              </div>
            </>
          )}
        </dl>
      </div>
      {!blocked && (
        <>
          <label className="submission-lifecycle-check">
            <input
              type="checkbox"
              checked={confirmed}
              disabled={busy}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            <span>
              {copy.title} 사유와 집계·이상사항 처리 안내를 확인했습니다.
            </span>
          </label>
          <div className="submission-detail-actions">
            <Button
              className="admin-button-secondary"
              disabled={busy}
              onClick={onBack}
            >
              사유 다시 작성
            </Button>
            <Button
              className={
                action === 'cancel' ? 'submission-lifecycle-danger' : undefined
              }
              loading={busy}
              disabled={!confirmed || busy}
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
