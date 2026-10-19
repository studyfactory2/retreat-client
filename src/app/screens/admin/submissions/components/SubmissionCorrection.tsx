import { useEffect, useId, useRef, useState } from 'react';
import { useAdminNavigationGuard } from '../../hooks/use-admin-navigation-guard';
import { ApiRequestError } from '../../../../core/api/api-error';
import type { AdminSubmissionDetail } from '../../../../features/admin-submissions/admin-submissions.types';
import type {
  AdminSubmissionCorrectionInput,
  AdminSubmissionCorrectionReceipt,
} from '../../../../features/admin-submissions/admin-submission-correction.types';
import { prepareAdminSubmissionCorrection } from '../../../../features/admin-submissions/admin-submission-correction.validation';
import { Button } from '../../../../shared/ui/Button/Button';
import { useSubmissionCorrection } from '../hooks/use-submission-correction';
import {
  dirtySubmissionCorrection,
  submissionCorrectionForm,
} from '../model/submission-correction-model';
import type { SubmissionLinkEditState } from './SubmissionStayLink';
import { SubmissionCorrectionFields } from './SubmissionCorrectionFields';
import { SubmissionCorrectionReview } from './SubmissionCorrectionReview';
import '../styles/submission-correction.css';

export function SubmissionCorrection({
  detail,
  token,
  rejectSession,
  onSaved,
  onReload,
  onClose,
  onEditStateChange,
}: {
  detail: AdminSubmissionDetail;
  token: string;
  rejectSession: (token: string) => void;
  onSaved: (receipt: AdminSubmissionCorrectionReceipt) => void;
  onReload: () => void;
  onClose: () => void;
  onEditStateChange: (state: SubmissionLinkEditState) => void;
}) {
  const [form, setForm] = useState(() => submissionCorrectionForm(detail));
  const [review, setReview] = useState<AdminSubmissionCorrectionInput>();
  const [validation, setValidation] = useState<string>();
  const notice = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const headingId = useId();
  const mutation = useSubmissionCorrection(detail, token, rejectSession);
  const { busy, blocked, message } = mutation.state;
  const dirty = dirtySubmissionCorrection(detail, form);
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
      const prepared = prepareAdminSubmissionCorrection(detail, {
        expectedRevision: detail.currentRevision,
        items: form.items,
        generalNote: form.generalNote || null,
        reason: form.reason,
      });
      const snapshot = structuredClone(prepared);
      for (const item of snapshot.items) Object.freeze(item);
      Object.freeze(snapshot.items);
      Object.freeze(snapshot);
      setValidation(undefined);
      setReview(snapshot);
    } catch (error: unknown) {
      setValidation(
        error instanceof ApiRequestError
          ? error.message
          : '답변과 정정 사유를 확인해 주세요.',
      );
    }
  }
  return (
    <section
      className="submission-detail-card submission-correction"
      aria-labelledby={headingId}
    >
      <div className="submission-detail-section-heading">
        <div>
          <h2 ref={heading} id={headingId} tabIndex={-1}>
            {review ? '정정 내용 확인' : '내용 정정'}
          </h2>
        </div>
        <span className="submission-detail-badge">
          기준 버전 {detail.currentRevision}
        </span>
      </div>
      {!review && (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            prepareReview();
          }}
        >
          <details className="submission-correction-guide">
            <summary>정정 안내</summary>
            <p>
              제출 당시 답변과 메모를 수정합니다. 원래 작성자·이용 일정·제출
              시각은 유지되고, 관리자와 정정 사유는 이력에 남습니다.
            </p>
            <p>
              사진 추가·이동은 지원하지 않습니다. 정상·미응답으로 변경할 때
              제외되는 사진과 직원 조치 정보는 저장 전에 확인합니다.
            </p>
          </details>
          <SubmissionCorrectionFields
            detail={detail}
            form={form}
            disabled={busy || blocked}
            onChange={(update) => {
              if (!busy && !blocked) {
                setForm(update);
                setValidation(undefined);
              }
            }}
          />
          {!blocked && (
            <div className="submission-detail-actions">
              <Button
                className="admin-button-secondary"
                disabled={busy}
                onClick={onClose}
              >
                닫기
              </Button>
              <Button type="submit" disabled={busy}>
                정정 내용 검토
              </Button>
            </div>
          )}
        </form>
      )}
      {review && (
        <SubmissionCorrectionReview
          detail={detail}
          input={review}
          disabled={busy || blocked}
          busy={busy}
          blocked={blocked}
          onBack={() => {
            if (!busy && !blocked) setReview(undefined);
          }}
          onSave={() => {
            if (!busy && !blocked) void mutation.save(review, onSaved);
          }}
        />
      )}
      {(validation || message || blocked) && (
        <div
          className="submission-correction-message"
          role="alert"
          tabIndex={-1}
          ref={notice}
        >
          <p>
            {validation ||
              message ||
              '최신 저장 내용을 확인한 뒤 다시 정정해 주세요.'}
          </p>
          {blocked && (
            <>
              <p>
                최신 내용을 불러오면 입력한 정정 내용은 초기화됩니다. 현재
                기록과 이력에서 저장 여부를 확인해 주세요.
              </p>
              <div className="submission-detail-actions">
                <Button onClick={onReload}>최신 기록 확인</Button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
