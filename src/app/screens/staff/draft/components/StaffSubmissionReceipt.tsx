import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { StaffSubmissionReceiptDto } from '../../../../features/staff-submissions/staff-submissions.types';
import { staffHomePath } from '../../../../features/staff-entry/staff-home-return';
import { Button } from '../../../../shared/ui/Button/Button';
import { useStaffDraftLink } from '../hooks/use-staff-draft-link';
import { formatStaffDraftTime } from '../model/staff-draft-display';
import { StaffPrivateLink } from './StaffPrivateLink';
import '../styles/staff-finish.css';

export function StaffSubmissionReceipt({
  receipt,
  token,
}: {
  receipt: StaffSubmissionReceiptDto;
  token: string;
}) {
  const navigate = useNavigate();
  const [returnExpired, setReturnExpired] = useState(false);
  const canReturn =
    !returnExpired &&
    Boolean(staffHomePath(receipt.id, receipt.property.id, token));
  const link = useStaffDraftLink(token, receipt.expiresAt, false);
  return (
    <section className="staff-outcome" aria-labelledby="staff-receipt-title">
      <header className="staff-outcome-heading">
        <span className="staff-outcome-icon is-complete" aria-hidden="true">
          ✓
        </span>
        <div>
          <p>{receipt.property.name}</p>
          <h1 id="staff-receipt-title">정비 기록을 제출했어요</h1>
        </div>
      </header>
      <div className="staff-outcome-layout">
        <section className="staff-finish-panel">
          <h2>제출 내역</h2>
          <div className="staff-finish-metrics">
            <div>
              <span>점검 답변</span>
              <strong>{receipt.answeredItemCount}개</strong>
            </div>
            <div>
              <span>사진</span>
              <strong>{receipt.photoCount}장</strong>
            </div>
            <div>
              <span>이상 접수</span>
              <strong>{receipt.reportedIssueCount}건</strong>
            </div>
          </div>
          <dl className="staff-finish-fields">
            <div>
              <dt>정비일</dt>
              <dd>
                <time dateTime={receipt.visitDate}>
                  {receipt.visitDate.replaceAll('-', '.')}
                </time>
              </dd>
            </div>
            <div>
              <dt>최초 제출</dt>
              <dd>
                <time dateTime={receipt.submittedAt}>
                  {formatStaffDraftTime(receipt.submittedAt)} (한국 시간)
                </time>
              </dd>
            </div>
            {receipt.property.region && (
              <div>
                <dt>지역</dt>
                <dd>{receipt.property.region}</dd>
              </div>
            )}
          </dl>
        </section>
        <section className="staff-finish-panel staff-outcome-actions">
          <h2>작업 목록</h2>
          {canReturn ? (
            <Button
              onClick={() => {
                const path = staffHomePath(
                  receipt.id,
                  receipt.property.id,
                  token,
                );
                if (path) {
                  void navigate(path, { state: { showCompleted: true } });
                } else {
                  setReturnExpired(true);
                }
              }}
            >
              완료 목록 보기
            </Button>
          ) : (
            <p>이 휴양소의 직원 QR에서 완료 목록을 확인할 수 있어요.</p>
          )}
          <details className="staff-finish-disclosure">
            <summary>제출 확인 링크 보관</summary>
            <StaffPrivateLink
              link={link}
              expiresAt={receipt.expiresAt}
              label="제출 확인 링크 복사"
            />
          </details>
        </section>
      </div>
    </section>
  );
}
