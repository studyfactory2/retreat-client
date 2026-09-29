import { Link } from 'react-router-dom';
import type { AdminSubmissionSummary } from '../../../../features/admin-submissions/admin-submissions.types';
import { submissionTime, submissionTypeLabel } from '../model/submission-list-model';

export function SubmissionRows({
  items,
  detailSearch,
}: {
  items: AdminSubmissionSummary[];
  detailSearch: string;
}) {
  return (
    <div className="submission-table-wrap">
      <table className="submission-table" role="table">
        <caption className="submission-sr-only">저장된 체크리스트 기록</caption>
        <thead role="rowgroup">
          <tr role="row">
            {[
              '휴양소',
              '유형 / 방문일',
              '작성자',
              '기록 요약',
              '제출 일시 · 한국 시간',
              '상세',
            ].map((label) => (
              <th key={label} scope="col" role="columnheader">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup">
          {items.map((item) => (
            <tr key={item.id} role="row">
              <td role="cell">
                <span className="submission-mobile-label" aria-hidden="true">
                  휴양소
                </span>
                <strong className="submission-property-name">
                  {item.property.name}
                </strong>
                {item.property.region && (
                  <p className="submission-row-muted">{item.property.region}</p>
                )}
              </td>
              <td role="cell">
                <span className="submission-mobile-label" aria-hidden="true">
                  유형 / 방문일
                </span>
                <div className="submission-badges">
                  <span className="submission-type-badge">
                    {submissionTypeLabel[item.type]}
                  </span>
                  <span
                    className={`submission-status${item.status === 'CANCELLED' ? ' submission-status--cancelled' : ''}`}
                  >
                    {item.status === 'CANCELLED' ? '취소됨' : '제출됨'}
                  </span>
                </div>
                <time
                  className="submission-visit-date"
                  dateTime={item.visitDate}
                >
                  {item.visitDate}
                </time>
                {item.type !== 'MAINTENANCE' && (
                  <p className="submission-row-muted">
                    {item.stayId !== null
                      ? '일정 연결됨'
                      : item.status === 'SUBMITTED' &&
                          item.authorSource === 'GUEST_QR'
                        ? '일정 미연결'
                        : '연결된 일정 없음'}
                  </p>
                )}
              </td>
              <td role="cell">
                <span className="submission-mobile-label" aria-hidden="true">
                  작성자
                </span>
                <strong>{item.author.name}</strong>
                <p className="submission-row-muted">
                  {item.author.role === 'GUEST' ? '이용객' : '정비 담당자'}
                </p>
              </td>
              <td role="cell">
                <span className="submission-mobile-label" aria-hidden="true">
                  기록 요약
                </span>
                <p>응답 {item.answeredItemCount}개</p>
                <p
                  className={
                    item.abnormalItemCount > 0
                      ? 'submission-abnormal'
                      : 'submission-row-muted'
                  }
                >
                  이상 응답 {item.abnormalItemCount}개 · 사진 {item.photoCount}
                  장
                </p>
              </td>
              <td role="cell">
                <span className="submission-mobile-label" aria-hidden="true">
                  제출 일시 · 한국 시간
                </span>
                <time dateTime={item.submittedAt}>
                  {submissionTime(item.submittedAt)}
                </time>
              </td>
              <td role="cell">
                <Link
                  className="submission-detail-link"
                  to={`/admin/submissions/${item.id}${detailSearch}`}
                  aria-label={`${item.property.name} ${item.visitDate} ${submissionTypeLabel[item.type]} 기록 상세`}
                >
                  기록 보기 <span aria-hidden="true">→</span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
