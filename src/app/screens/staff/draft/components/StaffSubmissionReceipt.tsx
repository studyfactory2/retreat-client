import type { StaffSubmissionReceiptDto } from '../../../../features/staff-submissions/staff-submissions.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { useStaffDraftLink } from '../hooks/use-staff-draft-link';
import { formatStaffDraftTime } from '../model/staff-draft-display';

export function StaffSubmissionReceipt({
  receipt,
  token,
}: {
  receipt: StaffSubmissionReceiptDto;
  token: string;
}) {
  const { copy, message, busy } = useStaffDraftLink(
    token,
    receipt.expiresAt,
    false,
  );
  return (
    <>
      <section className="staff-draft-intro staff-flow-receipt">
        <span className="staff-flow-check" aria-hidden="true">
          ✓
        </span>
        <span className="staff-draft-eyebrow">정비 기록 제출 완료</span>
        <h1>정비 기록을 제출했습니다</h1>
        <p>
          {receipt.property.region ? `${receipt.property.region} · ` : ''}
          {receipt.property.name}
        </p>
        <p>체크리스트와 사진이 접수되었습니다.</p>
      </section>
      <section
        className="staff-draft-card staff-flow-receipt-details"
        aria-label="정비 제출 확인"
      >
        <dl className="staff-draft-identity">
          <div>
            <dt>정비일</dt>
            <dd>{receipt.visitDate.replaceAll('-', '.')}</dd>
          </div>
          <div>
            <dt>제출 시각</dt>
            <dd>{formatStaffDraftTime(receipt.submittedAt)}</dd>
          </div>
          <div>
            <dt>접수 내용</dt>
            <dd>
              답변 {receipt.answeredItemCount}개 · 사진 {receipt.photoCount}장 ·
              이상 {receipt.reportedIssueCount}건
            </dd>
          </div>
        </dl>
        <p className="staff-draft-hint">
          최초 제출 내역이며, 시각은 한국 시간 기준입니다.
        </p>
        <details className="staff-flow-details">
          <summary>제출 내역을 다시 확인하려면</summary>
          <p>
            이 개인 링크를 보관하면 사용 기한까지 제출 내역을 다시 확인할 수
            있습니다. 현장 QR으로는 이 제출 내역을 다시 열 수 없습니다.
          </p>
          <p>
            이 링크를 가진 사람은 내용을 볼 수 있으므로 다른 사람에게 공유하지
            마세요.
          </p>
          <Button disabled={busy} onClick={() => void copy()}>
            개인 제출 확인 링크 복사
          </Button>
          <p className="staff-draft-hint">
            사용 기한: {formatStaffDraftTime(receipt.expiresAt)} (한국 시간)
          </p>
          <p aria-live="polite">{message}</p>
        </details>
      </section>
    </>
  );
}
