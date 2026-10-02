import type { GuestIssueReceiptDto } from '../../../../features/guest-issues/guest-issues.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { formatGuestStayTimestamp } from '../../entry/model/guest-entry-model';

export function GuestIssueReceipt({
  receipt,
  disabled,
  onHome,
}: {
  receipt: GuestIssueReceiptDto;
  disabled: boolean;
  onHome: () => void;
}) {
  return (
    <section
      className="guest-card guest-issue-receipt"
      aria-labelledby="issue-receipt-title"
    >
      <div className="guest-issue-receipt__mark" aria-hidden="true">
        ✓
      </div>
      <p className="guest-eyebrow">접수 완료</p>
      <h1 id="issue-receipt-title">신고가 접수되었습니다</h1>
      <p>알려주신 내용이 관리자에게 전달되었습니다.</p>
      <dl>
        <div>
          <dt>휴양소</dt>
          <dd>{receipt.property.name}</dd>
        </div>
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
      <div className="guest-issue-note">
        <p>
          접수 확인이며, 수리가 완료되었다는 뜻은 아닙니다. 긴급한 도움이
          필요하면 관리자에게 직접 연락해 주세요.
        </p>
        <p>
          이 확인 화면은 창을 닫거나 새로고침하면 다시 조회할 수 없습니다.
          필요하면 접수 번호를 보관해 주세요.
        </p>
      </div>
      <Button disabled={disabled} onClick={onHome}>
        휴양소 홈으로
      </Button>
    </section>
  );
}
