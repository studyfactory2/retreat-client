import type { GuestSubmissionDetailDto } from '../../../../features/guest-submission-details/guest-submission-details.types';
import { formatGuestStayTimestamp } from '../../entry/model/guest-entry-model';

export function GuestSubmissionSummary({
  detail,
}: {
  detail: GuestSubmissionDetailDto;
}) {
  return (
    <section
      className="guest-draft-card guest-draft-person"
      aria-label="제출 정보"
    >
      <dl>
        <div>
          <dt>이용일</dt>
          <dd>{detail.visitDate.replaceAll('-', '.')}</dd>
        </div>
        <div>
          <dt>이용객</dt>
          <dd>
            {detail.guest.name}
            <small>
              {[detail.guest.company, detail.guest.department]
                .filter(Boolean)
                .join(' · ') || '회사 · 부서 미입력'}
            </small>
          </dd>
        </div>
        {detail.guest.phone && (
          <div>
            <dt>연락처</dt>
            <dd>{detail.guest.phone}</dd>
          </div>
        )}
        <div>
          <dt>최초 제출</dt>
          <dd>{formatGuestStayTimestamp(detail.submittedAt)}</dd>
        </div>
        <div>
          <dt>표시 중인 버전</dt>
          <dd>
            {detail.revision}차
            <small>
              {formatGuestStayTimestamp(detail.updatedAt)} · 한국 시간
            </small>
          </dd>
        </div>
      </dl>
      <p className="guest-submitted-hint">
        제출 당시의 이용 정보와 체크리스트를 표시합니다.
      </p>
    </section>
  );
}
