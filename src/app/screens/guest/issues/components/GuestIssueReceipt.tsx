import type { GuestIssueReceiptDto } from '../../../../features/guest-issues/guest-issues.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { formatGuestStayTimestamp } from '../../entry/model/guest-entry-model';
import { GuestManagerContact } from '../../components/GuestManagerContact';

export function GuestIssueReceipt({
  receipt,
  contactPhone,
  disabled,
  onHome,
}: {
  receipt: GuestIssueReceiptDto;
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
          <p className="guest-eyebrow">접수 완료</p>
          <h1 id="issue-receipt-title">신고를 접수했어요</h1>
        </div>
      </header>
      <div className="guest-card guest-issue-receipt__summary">
        <div className="guest-issue-section-heading">
          <h2>{receipt.property.name}</h2>
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
        </dl>
        <p className="guest-issue-hint">
          접수 확인이며, 수리가 완료되었다는 뜻은 아닙니다.
        </p>
      </div>
      <div className="guest-issue-note">
        <p>
          이 화면은 새로고침하거나 창을 닫으면 다시 조회할 수 없습니다. 필요하면
          접수 번호를 보관해 주세요.
        </p>
        <p>
          긴급 표시는 별도 알림이나 전화를 보내지 않습니다. 바로 도움이 필요하면
          관리자에게 연락해 주세요.
        </p>
      </div>
      <GuestManagerContact phone={contactPhone} disabled={disabled} />
      <Button disabled={disabled} onClick={onHome}>
        휴양소 홈으로
      </Button>
    </section>
  );
}
