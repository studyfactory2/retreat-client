import { useNavigate } from 'react-router-dom';
import { Button } from '../../../../shared/ui/Button/Button';
import type { GuestSubmissionReceiptDto } from '../../../../features/guest-submissions/guest-submissions.types';
import { formatGuestStayTimestamp } from '../../entry/model/guest-entry-model';
import { DraftResumeLink } from './DraftResumeLink';
import '../styles/guest-journey-edge.css';

export function GuestSubmissionReceipt({
  receipt,
  token,
}: {
  receipt: GuestSubmissionReceiptDto;
  token: string;
}) {
  const navigate = useNavigate();
  const title = receipt.type === 'CHECK_IN' ? '입실 체크' : '퇴실 체크';
  return (
    <div className="guest-receipt">
      <header className="guest-receipt-heading">
        <span className="guest-receipt-check" aria-hidden="true">
          ✓
        </span>
        <div>
          <p className="guest-draft-eyebrow">제출 완료</p>
          <h1>{title}를 제출했어요</h1>
        </div>
      </header>
      <section
        className="guest-receipt-summary"
        aria-labelledby="guest-receipt-property"
      >
        <p className="guest-receipt-region">{receipt.property.region}</p>
        <h2 id="guest-receipt-property">{receipt.property.name}</h2>
        <dl className="guest-receipt-dates">
          <div>
            <dt>{receipt.type === 'CHECK_IN' ? '입실일' : '퇴실일'}</dt>
            <dd>{receipt.visitDate.replaceAll('-', '.')}</dd>
          </div>
          <div>
            <dt>제출 일시</dt>
            <dd>
              {formatGuestStayTimestamp(receipt.submittedAt)}
              <small>한국 시간 기준</small>
            </dd>
          </div>
        </dl>
        <dl className="guest-receipt-counts">
          <div>
            <dt>답변</dt>
            <dd>{receipt.answeredItemCount}개</dd>
          </div>
          <div>
            <dt>사진</dt>
            <dd>{receipt.photoCount}장</dd>
          </div>
          <div>
            <dt>이상 접수</dt>
            <dd>{receipt.reportedIssueCount}건</dd>
          </div>
        </dl>
        <p className="guest-receipt-original">
          최초 제출 내역입니다. 이후 답변을 수정해도 이 내역은 유지됩니다.
        </p>
      </section>
      <section className="guest-receipt-next" aria-label="제출 후 확인">
        <Button
          onClick={() =>
            navigate({
              pathname: '/draft',
              search: '?view=submission',
              hash: `#token=${token}`,
            })
          }
        >
          제출 내용 보기
        </Button>
        <p>최신 답변과 사진을 확인하고 답변을 수정할 수 있어요.</p>
        {receipt.reportedIssueCount > 0 && (
          <p className="guest-receipt-attention">
            이상으로 표시한 항목은 관리자에게 전달되었습니다. 긴급한 도움이
            필요하면 관리자에게 직접 연락해 주세요.
          </p>
        )}
      </section>
      <DraftResumeLink
        token={token}
        expiresAt={receipt.expiresAt}
        disabled={false}
        completed
        guided
      />
    </div>
  );
}
