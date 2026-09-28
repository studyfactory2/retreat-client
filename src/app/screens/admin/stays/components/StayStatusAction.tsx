import { useEffect, useRef, useState } from 'react';
import type { AdminStayDto } from '../../../../features/admin-stays/admin-stays.types';
import {
  cancelAdminStay,
  restoreAdminStay,
} from '../../../../features/admin-stays/admin-stay-management-api';
import { Button } from '../../../../shared/ui/Button/Button';
import { useStaySave } from '../hooks/use-stay-save';
import { useUnsavedStay } from '../hooks/use-unsaved-stay';
import { UnsavedStayNotice } from './UnsavedStayNotice';
import '../styles/stay-status-action.css';

export function StayStatusAction({
  stay,
  token,
  rejectSession,
  onSaved,
  onClose,
  onReload,
}: {
  stay: AdminStayDto;
  token: string;
  rejectSession: (token: string) => void;
  onSaved: (stay: AdminStayDto) => void;
  onClose: () => void;
  onReload: () => void;
}) {
  const cancelling = stay.status === 'ACTIVE';
  const action = cancelling ? '취소' : '복원';
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string>();
  const mutation = useStaySave(token, rejectSession);
  const leave = useUnsavedStay(reason.length > 0);
  const input = useRef<HTMLTextAreaElement>(null);
  const notice = useRef<HTMLDivElement>(null);
  const locked =
    mutation.state.busy || !!mutation.state.blocked || leave.pending;

  useEffect(() => {
    input.current?.focus();
  }, []);
  useEffect(() => {
    if (mutation.state.message) notice.current?.focus();
  }, [mutation.state.message]);

  function submit() {
    if (locked) return;
    const trimmed = reason.trim();
    if (!trimmed || [...trimmed].length > 1000) {
      setError(
        !trimmed
          ? `${action} 사유를 입력해 주세요.`
          : '사유는 1,000자 이하로 입력해 주세요.',
      );
      input.current?.focus();
      return;
    }
    setError(undefined);
    const operation = cancelling ? cancelAdminStay : restoreAdminStay;
    void mutation.save(
      (signal) =>
        operation(
          stay.id,
          { expectedRevision: stay.currentRevision, reason: trimmed },
          token,
          signal,
        ),
      onSaved,
    );
  }

  return (
    <section
      className="stay-card stay-status-action"
      aria-labelledby="stay-status-title"
    >
      <h2 id="stay-status-title">이용 일정을 {action}할까요?</h2>
      <p>
        {cancelling
          ? '취소하면 달력에서 제외됩니다. 기존 이용 정보와 변경 이력은 남으며, 일정 목록에서 다시 확인할 수 있습니다.'
          : '기존 이용 기간으로 복원합니다. 휴양소가 운영 중이고 다른 일정과 겹치지 않아야 합니다.'}
      </p>
      {mutation.state.message && (
        <div
          className="stay-banner stay-banner--error"
          role="alert"
          tabIndex={-1}
          ref={notice}
        >
          <p>{mutation.state.message}</p>
          {mutation.state.blocked && (
            <Button
              className="admin-button-secondary"
              onClick={() => leave.askToLeave(onReload)}
            >
              최신 기록 확인
            </Button>
          )}
        </div>
      )}
      {leave.pending && (
        <UnsavedStayNotice
          onKeep={leave.keepEditing}
          onDiscard={leave.discard}
        />
      )}
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="stay-field">
          <label htmlFor="stay-status-reason">
            {action} 사유 <span className="stay-field__required">필수</span>
          </label>
          <textarea
            id="stay-status-reason"
            ref={input}
            rows={3}
            required
            maxLength={1000}
            value={reason}
            disabled={locked}
            aria-invalid={
              !!(error ?? mutation.state.errors?.reason) || undefined
            }
            aria-describedby={`stay-status-hint${(error ?? mutation.state.errors?.reason) ? ' stay-status-error' : ''}`}
            onChange={(event) => {
              setReason(event.target.value);
              setError('');
            }}
          />
          <p className="stay-field__hint" id="stay-status-hint">
            작성한 사유와 처리한 관리자가 변경 이력에 남습니다. 최대 1,000자
          </p>
          {(error ?? mutation.state.errors?.reason) && (
            <p className="stay-field__error" id="stay-status-error">
              {error ?? mutation.state.errors?.reason}
            </p>
          )}
        </div>
        <div className="stay-actions">
          <Button
            className="admin-button-secondary"
            disabled={mutation.state.busy || leave.pending}
            onClick={() => leave.askToLeave(onClose)}
          >
            돌아가기
          </Button>
          <Button
            type="submit"
            className={cancelling ? 'stay-button-danger' : ''}
            loading={mutation.state.busy}
            disabled={locked}
          >
            {action} 확정
          </Button>
        </div>
      </form>
    </section>
  );
}
