import { useNavigate } from 'react-router-dom';
import { Button } from '../../../../shared/ui/Button/Button';
import type { GuestSubmissionReceiptDto } from '../../../../features/guest-submissions/guest-submissions.types';
import { formatGuestStayTimestamp } from '../../entry/model/guest-entry-model';
import { DraftResumeLink } from './DraftResumeLink';

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
    <>
      <section className="guest-draft-intro guest-submission-receipt">
        <div className="guest-submission-check" aria-hidden="true">
          ✓
        </div>
        <p className="guest-draft-eyebrow">제출 완료</p>
        <h1>{title}를 제출했습니다</h1>
        <p className="guest-draft-property">
          {receipt.property.region ? `${receipt.property.region} · ` : ''}
          {receipt.property.name}
        </p>
        <p>
          보내주신 체크리스트가 접수되었습니다. 아래는 최초 제출 내역입니다.
        </p>
      </section>
      <section
        className="guest-draft-card guest-draft-person"
        aria-label="제출 확인"
      >
        <dl>
          <div>
            <dt>이용일</dt>
            <dd>{receipt.visitDate.replaceAll('-', '.')}</dd>
          </div>
          <div>
            <dt>제출 일시</dt>
            <dd>
              {formatGuestStayTimestamp(receipt.submittedAt)}
              <small>한국 시간 기준</small>
            </dd>
          </div>
          <div>
            <dt>답변 항목</dt>
            <dd>{receipt.answeredItemCount}개</dd>
          </div>
          <div>
            <dt>첨부 사진</dt>
            <dd>{receipt.photoCount}장</dd>
          </div>
          <div>
            <dt>이상 접수</dt>
            <dd>{receipt.reportedIssueCount}건</dd>
          </div>
        </dl>
      </section>
      <section className="guest-draft-card guest-submission-thanks">
        <h2>함께 확인해 주셔서 감사합니다</h2>
        <p>
          이상으로 표시한 항목은 관리자에게 전달되었습니다. 긴급한 도움이
          필요하면 관리자에게 직접 연락해 주세요.
        </p>
        <p>
          아래에서 최신 답변과 사진을 확인하고 답변을 수정할 수 있습니다. 이
          최초 제출 내역은 수정 후에도 그대로 유지됩니다.
        </p>
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
      </section>
      <DraftResumeLink
        token={token}
        expiresAt={receipt.expiresAt}
        disabled={false}
        completed
      />
    </>
  );
}
