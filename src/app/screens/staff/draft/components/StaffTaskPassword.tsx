import { Button } from '../../../../shared/ui/Button/Button';
import { taskTime } from '../../../../features/cleaning-tasks/cleaning-tasks-display';
import type { TaskPasswordController } from '../hooks/use-task-password';
import '../styles/staff-task-password.css';

export function StaffTaskPassword({
  controller: c,
  disabled,
}: {
  controller: TaskPasswordController;
  disabled: boolean;
}) {
  const target = c.context;
  const ready = c.status === 'ready' && target?.canComplete;
  return (
    <section
      className="staff-task-password"
      aria-labelledby="task-password-title"
    >
      <header>
        <h2 id="task-password-title">현장 도어락 확인</h2>
        <Button
          className="staff-task-refresh"
          disabled={disabled || c.status === 'loading' || c.revealing}
          onClick={c.refresh}
          aria-label="도어락 상태 다시 확인"
        >
          <svg
            viewBox="0 0 24 24"
            width="17"
            height="17"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
          >
            <path
              d="M20 10a8 8 0 1 0 .1 4M20 4v6h-6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          다시 확인
        </Button>
      </header>
      {c.status === 'loading' ? (
        <p className="staff-lock-feedback" role="status">
          도어락 상태를 확인하고 있어요.
        </p>
      ) : c.status === 'error' || !target ? (
        <div className="staff-lock-notice" role="alert">
          <strong>도어락 상태 확인 필요</strong>
          <p>{c.message || '잠시 후 다시 확인을 눌러 주세요.'}</p>
        </div>
      ) : !ready ? (
        <div className="staff-lock-notice" role="status">
          <strong>완료 제출 대기</strong>
          <p>
            {target.blockedReason ??
              '관리자에게 일정과 비밀번호를 확인해 주세요.'}
          </p>
        </div>
      ) : (
        <>
          <div className="staff-lock-target">
            <strong>
              {target.kind === 'FIXED'
                ? '고정 비밀번호 유지'
                : target.kind === 'VACANCY'
                  ? '공실 비밀번호로 변경'
                  : '다음 예약 비밀번호로 변경'}
            </strong>
            {target.nextCheckInAt && (
              <span>다음 입실 {taskTime(target.nextCheckInAt)}</span>
            )}
            {target.requiresChange && (
              <>
                <div className="staff-task-secret">
                  <span aria-label={c.code ? undefined : '숨겨진 비밀번호'}>
                    {c.code ?? '••••••'}
                  </span>
                  <Button
                    aria-label={c.code ? '비밀번호 숨기기' : '비밀번호 보기'}
                    disabled={disabled}
                    loading={c.revealing}
                    onClick={() => void c.reveal()}
                  >
                    {c.code ? '숨기기' : '보기'}
                  </Button>
                </div>
                <small>표시한 번호는 30초 뒤 숨겨집니다.</small>
              </>
            )}
          </div>
          <label className="staff-lock-check">
            <input
              type="checkbox"
              checked={c.guestDeparted}
              disabled={disabled}
              onChange={(e) => c.setGuestDeparted(e.target.checked)}
            />
            <span>이전 이용객의 퇴실을 현장에서 확인했어요.</span>
          </label>
          {target.requiresChange && (
            <label className="staff-lock-check">
              <input
                type="checkbox"
                checked={c.passwordChanged}
                disabled={disabled}
                onChange={(e) => c.setPasswordChanged(e.target.checked)}
              />
              <span>도어락을 위 비밀번호로 직접 변경했어요.</span>
            </label>
          )}
        </>
      )}
    </section>
  );
}
