import { useEffect, useId, useRef, useState } from 'react';
import { useAdminNavigationGuard } from '../../hooks/use-admin-navigation-guard';
import { ApiRequestError } from '../../../../core/api/api-error';
import type { AdminSubmissionDetail } from '../../../../features/admin-submissions/admin-submissions.types';
import type {
  AdminSubmissionLifecycleAction,
  AdminSubmissionLifecycleInput,
  AdminSubmissionLifecycleReceipt,
} from '../../../../features/admin-submissions/admin-submission-lifecycle.types';
import {
  ADMIN_LIFECYCLE_REASON_LIMIT,
  prepareAdminSubmissionLifecycle,
} from '../../../../features/admin-submissions/admin-submission-lifecycle.validation';
import { Button } from '../../../../shared/ui/Button/Button';
import { useSubmissionLifecycle } from '../hooks/use-submission-lifecycle';
import { submissionLifecyclePresentation } from '../model/submission-lifecycle-model';
import type { SubmissionLinkEditState } from './SubmissionStayLink';
import { SubmissionLifecycleConfirmation } from './SubmissionLifecycleConfirmation';
import '../styles/submission-lifecycle.css';

export function SubmissionLifecycle({
  detail,
  action,
  token,
  rejectSession,
  onSaved,
  onReload,
  onClose,
  onEditStateChange,
}: {
  detail: AdminSubmissionDetail;
  action: AdminSubmissionLifecycleAction;
  token: string;
  rejectSession: (token: string) => void;
  onSaved: (receipt: AdminSubmissionLifecycleReceipt) => void;
  onReload: () => void;
  onClose: () => void;
  onEditStateChange: (state: SubmissionLinkEditState) => void;
}) {
  const [reason, setReason] = useState('');
  const [review, setReview] = useState<AdminSubmissionLifecycleInput>();
  const [validation, setValidation] = useState<string>();
  const heading = useRef<HTMLHeadingElement>(null);
  const notice = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const reasonId = useId();
  const reasonHintId = useId();
  const errorId = useId();
  const copy = submissionLifecyclePresentation(action);
  const mutation = useSubmissionLifecycle(detail, action, token, rejectSession);
  const { busy, blocked, message } = mutation.state;
  const dirty = reason.length > 0;
  useAdminNavigationGuard(dirty || busy || blocked);
  useEffect(() => {
    onEditStateChange({ dirty, busy, blocked });
    return () =>
      onEditStateChange({ dirty: false, busy: false, blocked: false });
  }, [dirty, busy, blocked, onEditStateChange]);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  useEffect(() => {
    if (validation || message) notice.current?.focus();
  }, [validation, message]);
  function prepareReview() {
    if (busy || blocked) return;
    try {
      const input = prepareAdminSubmissionLifecycle(detail, action, {
        expectedRevision: detail.currentRevision,
        reason,
      });
      setReview(Object.freeze({ ...input }));
      setValidation(undefined);
    } catch (error: unknown) {
      setValidation(
        error instanceof ApiRequestError
          ? error.message
          : '변경 사유를 확인해 주세요.',
      );
    }
  }
  return (
    <section
      className={`submission-detail-card submission-lifecycle${action === 'cancel' ? ' submission-lifecycle--cancel' : ''}`}
      aria-labelledby={headingId}
    >
      <div className="submission-detail-section-heading">
        <h2 id={headingId} ref={heading} tabIndex={-1}>
          {copy.title}
        </h2>
        <span className="submission-detail-badge">
          기준 버전 {detail.currentRevision}
        </span>
      </div>
      {!review ? (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            prepareReview();
          }}
        >
          <p>{copy.introduction}</p>
          <p className="submission-detail-caption">
            기록과 사진을 삭제하지 않으며 연결된 이상사항은 그대로 유지됩니다.
            저장 전에 영향을 한 번 더 확인합니다.
          </p>
          <label htmlFor={reasonId}>{copy.reasonLabel} · 필수</label>
          <textarea
            id={reasonId}
            rows={3}
            value={reason}
            disabled={busy || blocked}
            aria-required="true"
            aria-invalid={!!validation || undefined}
            aria-describedby={`${reasonHintId}${validation ? ` ${errorId}` : ''}`}
            onChange={(event) => {
              if (!busy && !blocked) {
                setReason(event.target.value);
                setValidation(undefined);
              }
            }}
          />
          <p id={reasonHintId} className="submission-detail-caption">
            1–{ADMIN_LIFECYCLE_REASON_LIMIT}자로 입력해 주세요. 현재{' '}
            {[...reason.trim()].length.toLocaleString('ko-KR')}자
          </p>
          {!blocked && (
            <div className="submission-detail-actions">
              <Button
                className="admin-button-secondary"
                disabled={busy}
                onClick={onClose}
              >
                닫기
              </Button>
              <Button disabled={busy} type="submit">
                {copy.reviewLabel}
              </Button>
            </div>
          )}
        </form>
      ) : (
        <SubmissionLifecycleConfirmation
          detail={detail}
          action={action}
          input={review}
          busy={busy}
          blocked={blocked}
          onBack={() => {
            if (!busy && !blocked) setReview(undefined);
          }}
          onConfirm={() => {
            if (!busy && !blocked) void mutation.save(review, onSaved);
          }}
        />
      )}
      {(validation || message || blocked) && (
        <div
          className="submission-lifecycle-notice"
          role="alert"
          tabIndex={-1}
          ref={notice}
        >
          <p id={errorId}>
            {validation ||
              message ||
              '최신 기록에서 저장 상태를 확인해 주세요.'}
          </p>
          {blocked && (
            <>
              <p>
                다시 저장하기 전에 최신 상태와 이력을 확인해 주세요. 새로
                불러오면 입력한 사유는 초기화됩니다.
              </p>
              <Button onClick={onReload}>최신 기록 확인</Button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
