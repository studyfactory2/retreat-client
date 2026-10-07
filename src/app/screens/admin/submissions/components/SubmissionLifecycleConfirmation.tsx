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
      <h3 id={headingId} ref={heading} tabIndex={-1}>
        {copy.title} 내용을 확인해 주세요
      </h3>
      <p className="submission-lifecycle-transition">{copy.transition}</p>
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
      <div className="submission-lifecycle-consequences">
        <p>{copy.operationalEffect}</p>
        <p>
          답변·사진·원래 작성자·이용 일정 연결과 이전 이력은 유지됩니다. 첨부
          파일은 삭제되지 않습니다.
        </p>
        <p>
          <strong>연결된 이상사항은 변경되지 않습니다.</strong> 긴급도·처리
          상태·해결 정보·이전 이상사항 연결과 원래 증거를 유지하며, 자동으로
          취소하거나 해결하지 않습니다.
        </p>
        {action === 'cancel' ? (
          <p>
            취소된 체크리스트를 출처로 한 이상사항도 계속 처리할 수 있습니다.
          </p>
        ) : (
          <>
            <p>
              이전 정정에서 제외한 사진이나 직원 조치 정보는 복구되지 않습니다.
              현재 저장된 답변과 사진만 유지합니다.
            </p>
            <p>
              원래 제출 시각은 유지됩니다. 이용 일정의 상태를 바꾸거나 접속
              링크의 유효기간을 늘리지 않습니다.
            </p>
          </>
        )}
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
