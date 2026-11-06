import type { GuestSubmissionDetailDto } from '../../../../features/guest-submission-details/guest-submission-details.types';
import { formatGuestStayTimestamp } from '../../entry/model/guest-entry-model';
import type { ReadyGuestSubmission } from '../model/guest-submission-model';

export function GuestSubmissionSummary({
  detail,
  mode,
}: {
  detail: GuestSubmissionDetailDto;
  mode: ReadyGuestSubmission['mode'];
}) {
  const visitDate = detail.visitDate.replaceAll('-', '.');
  const organization = [detail.guest.company, detail.guest.department]
    .filter(Boolean)
    .join(' · ');
  const abnormalCount = detail.answers.items.filter(
    (answer) => answer.value === 'ABNORMAL',
  ).length;
  const action =
    mode === 'view' ? '내용' : mode === 'edit' ? '수정' : '수정 확인';
  return (
    <section
      className="guest-record-summary"
      aria-labelledby="guest-record-title"
    >
      <header className="guest-record-heading">
        <div className="guest-record-property">{detail.property.name}</div>
        <div className="guest-record-title">
          <h1 id="guest-record-title">
            {detail.type === 'CHECK_IN' ? '입실 체크' : '퇴실 체크'} {action}
          </h1>
          <span className="guest-record-version">버전 {detail.revision}</span>
        </div>
        <p>
          {detail.guest.name} · 이용일 {visitDate}
        </p>
      </header>
      {mode === 'view' && (
        <ul className="guest-record-counts" aria-label="제출 요약">
          <li>
            답변 <strong>{detail.answers.items.length}개</strong>
          </li>
          <li>
            사진 <strong>{detail.photos.length}장</strong>
          </li>
          <li>
            이상 응답 <strong>{abnormalCount}건</strong>
          </li>
        </ul>
      )}
      <details className="guest-record-metadata">
        <summary>
          제출 정보
          <span aria-hidden="true" className="guest-record-chevron" />
        </summary>
        <dl>
          {detail.property.region && (
            <div>
              <dt>지역</dt>
              <dd>{detail.property.region}</dd>
            </div>
          )}
          {organization && (
            <div>
              <dt>소속</dt>
              <dd>{organization}</dd>
            </div>
          )}
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
          {detail.revision > 1 && (
            <div>
              <dt>최근 수정</dt>
              <dd>{formatGuestStayTimestamp(detail.updatedAt)}</dd>
            </div>
          )}
        </dl>
        <small>한국 시간 기준</small>
      </details>
    </section>
  );
}
