import type { ReadyGuestIssueReport } from '../model/guest-issue-report-model';
import { Button } from '../../../../shared/ui/Button/Button';
import { formatGuestStayTimestamp } from '../../entry/model/guest-entry-model';
import { GuestManagerContact } from '../../components/GuestManagerContact';

export function GuestIssueReceipt({
  receipt,
  contactPhone,
  disabled,
  onHome,
}: {
  receipt: NonNullable<ReadyGuestIssueReport['receipt']>;
  contactPhone: string | null;
  disabled: boolean;
  onHome: () => void;
}) {
  return (
    <section
      className="guest-issue-receipt"
      aria-labelledby="issue-receipt-title"
    >
      <header className="guest-issue-receipt__heading">
        <span className="guest-issue-receipt__mark" aria-hidden="true">
          ✓
        </span>
        <div>
          <h1 id="issue-receipt-title">신고 접수 완료</h1>
          <p className="guest-issue-property">{receipt.property.name}</p>
        </div>
      </header>
      <div className="guest-card guest-issue-receipt__summary">
        <div className="guest-issue-section-heading">
          <h2>{receipt.title}</h2>
          <span
            className={`guest-issue-badge${receipt.isUrgent ? ' is-urgent' : ''}`}
          >
            {receipt.isUrgent ? '긴급' : '일반'}
          </span>
        </div>
        <dl>
          <div>
            <dt>접수 일시</dt>
            <dd>
              {formatGuestStayTimestamp(receipt.receivedAt)}
              <small>한국 시간 기준</small>
            </dd>
          </div>
          <div>
            <dt>접수 번호</dt>
            <dd className="guest-issue-receipt__id">{receipt.issueId}</dd>
          </div>
          <div>
            <dt>첨부 사진</dt>
            <dd>{receipt.photoCount}장</dd>
          </div>
        </dl>
        <p className="guest-issue-hint">
          접수 번호는 이 화면에서만 확인할 수 있어요. 새로고침하거나 나가기 전에
          보관해 주세요.
        </p>
      </div>
      {receipt.isUrgent && (
        <p className="guest-issue-note">
          긴급 표시는 관리자 확인용입니다. 바로 도움이 필요하면 관리자에게
          전화해 주세요.
        </p>
      )}
      <GuestManagerContact phone={contactPhone} disabled={disabled} />
      <Button disabled={disabled} onClick={onHome}>
        휴양소 홈으로
      </Button>
    </section>
  );
}
