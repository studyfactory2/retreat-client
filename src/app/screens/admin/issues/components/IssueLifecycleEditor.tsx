import { useEffect, useId, useRef, useState } from 'react';
import { useAdminNavigationGuard } from '../../hooks/use-admin-navigation-guard';
import { ApiRequestError } from '../../../../core/api/api-error';
import type { AdminIssueRecordDto } from '../../../../features/admin-issues/admin-issues.types';
import type { IssueLifecycleAction } from '../../../../features/admin-issues/admin-issue-lifecycle.types';
import {
  ISSUE_LIFECYCLE_REASON_LIMIT,
  prepareIssueLifecycle,
} from '../../../../features/admin-issues/admin-issue-lifecycle.validation';
import { Button } from '../../../../shared/ui/Button/Button';
import type {
  IssueActionCommand,
  IssueActionMutation,
} from '../model/issue-action-model';
import { issueLifecyclePresentation } from '../model/issue-lifecycle-model';
import { IssueLifecycleConfirmation } from './IssueLifecycleConfirmation';
import { IssueMutationNotice } from './IssueMutationNotice';
import '../styles/issue-lifecycle.css';

type LifecycleCommand = Extract<
  IssueActionCommand,
  { kind: 'cancel' | 'restore' }
>;
export function IssueLifecycleEditor({
  issue,
  action,
  mutation,
  onSubmit,
  onDirtyChange,
  onReload,
  onClose,
}: {
  issue: AdminIssueRecordDto;
  action: IssueLifecycleAction;
  mutation: IssueActionMutation;
  onSubmit: (command: IssueActionCommand) => void;
  onDirtyChange: (dirty: boolean) => void;
  onReload: () => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [review, setReview] = useState<LifecycleCommand>();
  const [validation, setValidation] = useState<string>();
  const heading = useRef<HTMLHeadingElement>(null);
  const error = useRef<HTMLParagraphElement>(null);
  const headingId = useId();
  const reasonId = useId();
  const hintId = useId();
  const errorId = useId();
  const copy = issueLifecyclePresentation(action);
  const busy = mutation.status === 'saving';
  const blocked =
    mutation.status === 'conflict' || mutation.status === 'unknown';
  const dirty = reason.length > 0;
  useAdminNavigationGuard(dirty || busy || blocked);
  useEffect(() => {
    onDirtyChange(dirty);
    return () => onDirtyChange(false);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  useEffect(() => {
    if (validation) error.current?.focus();
  }, [validation]);
  function prepareReview() {
    if (busy || blocked) return;
    try {
      const prepared = prepareIssueLifecycle(issue, action, {
        expectedVersion: issue.currentVersion,
        reason,
      });
      setReview(Object.freeze({ kind: action, reason: prepared.reason }));
      setValidation(undefined);
    } catch (caught: unknown) {
      setValidation(
        caught instanceof ApiRequestError
          ? caught.message
          : '처리 사유와 현재 신고 상태를 확인해 주세요.',
      );
    }
  }
  return (
    <section
      className={`issue-detail-card issue-lifecycle${action === 'cancel' ? ' issue-lifecycle--cancel' : ''}`}
      aria-labelledby={headingId}
    >
      <div className="issue-detail-section-heading">
        <h2 ref={heading} id={headingId} tabIndex={-1}>
          {copy.title}
        </h2>
        <span className="issue-detail-caption">
          기준 버전 {issue.currentVersion}
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
          <p className="issue-detail-caption">
            최초 신고·사진·이력과 출처 체크리스트는 보존됩니다. 저장 전에 영향을
            다시 확인합니다.
          </p>
          <label htmlFor={reasonId}>{copy.reasonLabel} · 필수</label>
          <textarea
            id={reasonId}
            rows={3}
            value={reason}
            disabled={busy || blocked}
            aria-required="true"
            aria-invalid={!!validation || undefined}
            aria-describedby={`${hintId}${validation ? ` ${errorId}` : ''}`}
            onChange={(event) => {
              if (!busy && !blocked) {
                setReason(event.target.value);
                setValidation(undefined);
              }
            }}
          />
          <p id={hintId} className="issue-detail-caption">
            1–{ISSUE_LIFECYCLE_REASON_LIMIT}자로 입력해 주세요. 현재{' '}
            {[...reason.trim()].length.toLocaleString('ko-KR')}자
          </p>
          {!blocked && (
            <div className="issue-action-buttons">
              <Button
                className="admin-button-secondary"
                disabled={busy}
                onClick={onClose}
              >
                닫기
              </Button>
              <Button type="submit" disabled={busy}>
                {copy.reviewLabel}
              </Button>
            </div>
          )}
        </form>
      ) : (
        <IssueLifecycleConfirmation
          issue={issue}
          action={action}
          reason={review.reason}
          busy={busy}
          blocked={blocked}
          onBack={() => {
            if (!busy && !blocked) setReview(undefined);
          }}
          onConfirm={() => {
            if (!busy && !blocked) onSubmit(review);
          }}
        />
      )}
      {validation && (
        <p
          className="issue-actions__error"
          id={errorId}
          role="alert"
          tabIndex={-1}
          ref={error}
        >
          {validation}
        </p>
      )}
      <IssueMutationNotice mutation={mutation} onReload={onReload} />
    </section>
  );
}
