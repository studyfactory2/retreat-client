import { useNavigate } from 'react-router-dom';
import type { GuestSubmissionReceiptDto } from '../../../../features/guest-submissions/guest-submissions.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { GuestIcon } from '../../entry/components/GuestIcon';
import { formatGuestStayTimestamp } from '../../entry/model/guest-entry-model';
import { DraftResumeLink } from './DraftResumeLink';
import '../styles/guest-journey-edge.css';

export function GuestSubmissionReceipt({
  receipt,
  token,
  showHomeHelp,
}: {
  receipt: GuestSubmissionReceiptDto;
  token: string;
  showHomeHelp: boolean;
}) {
  const navigate = useNavigate();
  const checkIn = receipt.type === 'CHECK_IN';
  return (
    <section className="guest-receipt" aria-labelledby="guest-receipt-title">
      <header className="guest-receipt-heading">
        <span className="guest-receipt-check" aria-hidden="true">
          ✓
        </span>
        <h1 id="guest-receipt-title">
          {checkIn ? '입실' : '퇴실'} 체크 제출 완료
        </h1>
        <p>
          {[receipt.property.name, receipt.property.region]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </header>
      <div className="guest-receipt-body">
        <dl className="guest-receipt-dates">
          <div>
            <dt>{checkIn ? '입실일' : '퇴실일'}</dt>
            <dd>{receipt.visitDate.replaceAll('-', '. ')}</dd>
          </div>
          <div>
            <dt>제출 시각</dt>
            <dd>
              <time dateTime={receipt.submittedAt}>
                {formatGuestStayTimestamp(receipt.submittedAt)}
              </time>{' '}
              · 한국 시간
            </dd>
          </div>
        </dl>
        <dl className="guest-receipt-counts" aria-label="최초 제출 요약">
          <div>
            <dt>응답</dt>
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
          최초 제출 기록이에요. 최신 답변은 제출 내용에서 확인하세요.
        </p>
        {receipt.reportedIssueCount > 0 && (
          <p className="guest-receipt-attention">
            이상 항목을 관리자에게 전달했어요. 긴급한 경우 관리자에게 직접
            연락해 주세요.
          </p>
        )}
        <Button
          onClick={() =>
            navigate({
              pathname: '/draft',
              search: '?view=submission',
              hash: `#token=${token}`,
            })
          }
        >
          <GuestIcon name="receipt" /> 제출 내용 보기
        </Button>
        <DraftResumeLink
          token={token}
          expiresAt={receipt.expiresAt}
          disabled={false}
          completed
          showHomeHelp={showHomeHelp}
        />
      </div>
    </section>
  );
}
