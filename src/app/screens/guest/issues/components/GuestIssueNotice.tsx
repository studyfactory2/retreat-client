import { useEffect, useRef } from 'react';
import type { GuestIssueReportController } from '../hooks/use-guest-issue-report';
import type { ReadyGuestIssueReport } from '../model/guest-issue-report-model';
import { Button } from '../../../../shared/ui/Button/Button';

export function GuestIssueNotice({
  resource,
  controller,
}: {
  resource: ReadyGuestIssueReport;
  controller: GuestIssueReportController;
}) {
  const notice = useRef<HTMLElement>(null);
  const focusKey =
    resource.access === 'checking'
      ? null
      : resource.message && resource.mutation !== 'idle'
        ? resource.mutation
        : null;
  useEffect(() => {
    if (focusKey) {
      notice.current?.focus({ preventScroll: true });
      notice.current?.scrollIntoView({ block: 'start' });
    }
  }, [focusKey]);
  if (
    resource.access === 'ready' &&
    (!resource.message || resource.mode === 'received')
  )
    return null;
  const busy = resource.access === 'checking' || resource.mutation === 'saving';
  return (
    <section
      ref={notice}
      tabIndex={-1}
      className="guest-issue-notice"
      role={busy ? 'status' : 'alert'}
    >
      <p>
        {resource.access === 'checking'
          ? 'QR 접근과 신고 분류를 확인하고 있습니다…'
          : resource.message}
      </p>
      <div className="guest-issue-actions">
        {resource.access === 'blocked' && (
          <Button
            className="guest-issue-secondary"
            disabled={busy}
            onClick={controller.recheck}
          >
            연결 다시 확인
          </Button>
        )}
        {resource.attempt && resource.mutation === 'uncertain' && (
          <Button
            disabled={busy || resource.access !== 'ready'}
            onClick={controller.retry}
          >
            같은 신고로 접수 결과 확인
          </Button>
        )}
        {resource.mutation === 'category-conflict' && (
          <Button
            className="guest-issue-secondary"
            disabled={busy}
            onClick={controller.recheck}
          >
            신고 분류 다시 확인
          </Button>
        )}
      </div>
      {resource.attempt && (
        <p className="guest-issue-hint">
          이 화면을 유지해 주세요. 결과 확인은 보관한 동일한 내용과 사진으로
          요청합니다. 창을 닫으면 접수 여부를 다시 확인할 수 없습니다.
        </p>
      )}
    </section>
  );
}
