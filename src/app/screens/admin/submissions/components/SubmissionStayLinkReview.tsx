import type { RefObject } from 'react';
import type { SubmissionStayCandidate } from '../../../../features/admin-submissions/admin-submission-stays.types';
import { submissionTime } from '../model/submission-detail-model';

export function SubmissionStayLinkReview({
  mode,
  currentStayId,
  selected,
  reason,
  reasonInput,
  validation,
  disabled,
  onReasonChange,
}: {
  mode: 'select' | 'unlink';
  currentStayId: string | null;
  selected?: SubmissionStayCandidate;
  reason: string;
  reasonInput: RefObject<HTMLTextAreaElement | null>;
  validation?: string;
  disabled: boolean;
  onReasonChange: (value: string) => void;
}) {
  return (
    <>
      {mode === 'unlink' ? (
        <div className="submission-detail-notice">
          <strong>이용 일정과의 연결을 해제합니다.</strong>
          <p>
            제출 기록과 이용 일정은 삭제되지 않습니다. 이 기록은 연결되지 않은
            상태로 남습니다.
          </p>
        </div>
      ) : (
        selected && (
          <div className="submission-detail-notice" role="status">
            <strong>
              {selected.id === currentStayId
                ? '현재 일정 다시 확인'
                : currentStayId
                  ? '변경할 일정'
                  : '선택한 일정'}{' '}
              · {selected.guestName}
            </strong>
            <p>
              {submissionTime(selected.checkInAt)} ~{' '}
              {submissionTime(selected.checkOutAt)}
            </p>
            <p>
              {selected.phone || '연락처 미입력'} ·{' '}
              {selected.company || '회사 미입력'} ·{' '}
              {selected.department || '부서 미입력'}
            </p>
          </div>
        )
      )}
      <div className="submission-stay-reason">
        <label htmlFor="submission-stay-reason">
          {mode === 'unlink' ? '연결 해제 사유' : '연결 변경 사유'}{' '}
          <span>필수</span>
        </label>
        <textarea
          id="submission-stay-reason"
          ref={reasonInput}
          rows={3}
          value={reason}
          disabled={disabled}
          aria-describedby="submission-stay-reason-help submission-stay-validation"
          aria-invalid={!!validation || undefined}
          onChange={(event) => {
            onReasonChange(event.target.value);
          }}
        />
        <p
          id="submission-stay-reason-help"
          className="submission-detail-caption"
        >
          정보를 확인한 내용과 변경 이유를 입력해 주세요. 최대 1000자 ·{' '}
          {[...reason.trim()].length}자
        </p>
        <p
          id="submission-stay-validation"
          className="submission-stay-error"
          role={validation ? 'alert' : undefined}
        >
          {validation}
        </p>
      </div>
    </>
  );
}
