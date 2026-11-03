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
  const p = c.context;
  return (
    <section
      className="staff-task-password"
      aria-labelledby="task-password-title"
    >
      <header>
        <div>
          <span>마지막 확인</span>
          <h2 id="task-password-title">출입문 비밀번호</h2>
        </div>
        <button
          type="button"
          disabled={disabled || c.status === 'loading' || c.revealing}
          onClick={c.refresh}
          aria-label="비밀번호 최신 상태 확인"
        >
          ↻
        </button>
      </header>
      {c.status === 'loading' ? (
        <p role="status">최신 비밀번호 상태를 확인하고 있어요.</p>
      ) : c.status === 'error' || !p ? (
        <div className="staff-task-password-notice" role="alert">
          <strong>다시 확인해 주세요</strong>
          <p>{c.message}</p>
          <Button disabled={disabled} onClick={c.refresh}>
            최신 상태 확인
          </Button>
        </div>
      ) : !p.canComplete ? (
        <div className="staff-task-password-notice" role="status">
          <strong>관리자 확인 필요</strong>
          <p>
            {p.blockedReason ?? '일정과 비밀번호를 관리자에게 확인해 주세요.'}
          </p>
          <small>작성한 점검 내용과 사진은 보관됩니다.</small>
        </div>
      ) : (
        <>
          <div className="staff-task-password-target">
            <strong>
              {p.kind === 'FIXED'
                ? '변경 불필요 · 고정 번호'
                : p.kind === 'VACANCY'
                  ? '공실 비밀번호로 변경'
                  : '다음 예약 비밀번호로 변경'}
            </strong>
            {p.nextCheckInAt && (
              <span>다음 입실 · {taskTime(p.nextCheckInAt)}</span>
            )}
          </div>
          {p.requiresChange && (
            <>
              <div className="staff-task-secret">
                <span
                  aria-label={c.code ? '변경할 비밀번호' : '숨겨진 비밀번호'}
                >
                  {c.code ?? '••••••'}
                </span>
                <Button
                  disabled={disabled || c.revealing}
                  loading={c.revealing}
                  onClick={() => void c.reveal()}
                >
                  {c.code ? '숨기기' : '보기'}
                </Button>
              </div>
              <p className="staff-task-password-hint">
                현장에서 직접 변경해 주세요. 번호는 30초 후 숨겨집니다.
              </p>
            </>
          )}
          <label className="staff-task-password-check">
            <input
              type="checkbox"
              checked={c.guestDeparted}
              disabled={disabled}
              onChange={(e) => c.setGuestDeparted(e.target.checked)}
            />
            <span>이전 이용객이 퇴실한 것을 현장에서 확인했습니다.</span>
          </label>
          {p.requiresChange && (
            <label className="staff-task-password-check">
              <input
                type="checkbox"
                checked={c.passwordChanged}
                disabled={disabled}
                onChange={(e) => c.setPasswordChanged(e.target.checked)}
              />
              <span>
                위 비밀번호로 도어락 <strong>변경을 완료했습니다.</strong>
              </span>
            </label>
          )}
          {c.message && (
            <p className="staff-task-password-notice" role="alert">
              {c.message}
            </p>
          )}
        </>
      )}
    </section>
  );
}
