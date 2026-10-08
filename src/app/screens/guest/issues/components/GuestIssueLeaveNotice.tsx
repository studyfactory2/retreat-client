import { useEffect, useRef } from 'react';
import { Button } from '../../../../shared/ui/Button/Button';

export function GuestIssueLeaveNotice({
  message,
  canLeave,
  locked,
  onLeave,
  onStay,
}: {
  message: string;
  canLeave: boolean;
  locked: boolean;
  onLeave: () => void;
  onStay: () => void;
}) {
  const notice = useRef<HTMLElement>(null);
  useEffect(() => {
    notice.current?.focus({ preventScroll: true });
    notice.current?.scrollIntoView({ block: 'start' });
  }, [message, canLeave]);
  return (
    <section
      className="guest-issue-notice"
      ref={notice}
      tabIndex={-1}
      role="alert"
    >
      <h2>
        {canLeave ? '작성 중인 신고를 나갈까요?' : '잠시만 기다려 주세요'}
      </h2>
      <p>{message}</p>
      <div className="guest-issue-actions">
        {canLeave && (
          <Button disabled={locked} onClick={onLeave}>
            작성 취소하고 이동
          </Button>
        )}
        <Button className="guest-issue-secondary" onClick={onStay}>
          계속 머무르기
        </Button>
      </div>
    </section>
  );
}
