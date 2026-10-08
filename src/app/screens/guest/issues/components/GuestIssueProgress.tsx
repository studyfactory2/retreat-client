import type { ReadyGuestIssueReport } from '../model/guest-issue-report-model';

export function GuestIssueProgress({
  mode,
}: {
  mode: ReadyGuestIssueReport['mode'];
}) {
  const current = mode === 'received' ? 2 : mode === 'review' ? 1 : 0;
  return (
    <ol className="guest-issue-progress" aria-label="불편사항 신고 진행 단계">
      {['불편 내용 작성', '내용 확인', '접수 완료'].map((label, index) => (
        <li
          key={label}
          aria-current={index === current ? 'step' : undefined}
          className={index < current ? 'is-complete' : undefined}
        >
          <span aria-hidden="true">{index < current ? '✓' : index + 1}</span>
          {label}
        </li>
      ))}
    </ol>
  );
}
