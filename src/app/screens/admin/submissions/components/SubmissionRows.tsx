import { Link } from 'react-router-dom';
import type { AdminSubmissionSummary } from '../../../../features/admin-submissions/admin-submissions.types';
import { submissionTypeLabel } from '../model/submission-list-model';

export function SubmissionRows({
  items,
  detailSearch,
}: {
  items: AdminSubmissionSummary[];
  detailSearch: string;
}) {
  return (
    <div className="submission-list">
      <div className="submission-list-columns" aria-hidden="true">
        <span>구분</span>
        <span>휴양소 · 작성자</span>
        <span>방문일</span>
        <span>이상 응답 · 상태</span>
        <span />
      </div>
      <ul className="submission-rows" role="list" aria-label="제출 기록 목록">
        {items.map((item) => {
          const typeLabel = submissionTypeLabel[item.type];
          const cancelled = item.status === 'CANCELLED';
          const date = item.visitDate.replaceAll('-', '.');
          return (
            <li key={item.id}>
              <Link
                className={`submission-row${cancelled ? ' submission-row--cancelled' : ''}`}
                to={`/admin/submissions/${item.id}${detailSearch}`}
                aria-label={`${item.property.name}, ${item.visitDate} ${typeLabel}, ${item.author.name}, ${cancelled ? '취소됨' : '제출됨'}, 이상 응답 ${item.abnormalItemCount}개, 기록 상세`}
              >
                <span className="submission-row-type">
                  <span className={`submission-type-badge submission-type-badge--${item.type.toLowerCase()}`}>
                    {typeLabel}
                  </span>
                </span>
                <span className="submission-row-identity">
                  <strong className="submission-property-name">{item.property.name}</strong>
                  <span className="submission-row-context">
                    <span className="submission-compact-type">{typeLabel}</span>
                    <time className="submission-compact-date" dateTime={item.visitDate}>{date}</time>
                    <span className="submission-row-author">{item.author.name}</span>
                  </span>
                </span>
                <time className="submission-row-date" dateTime={item.visitDate}>{date}</time>
                <span className="submission-row-status">
                  {item.abnormalItemCount > 0 ? (
                    <span className="submission-abnormal">이상 응답 {item.abnormalItemCount}</span>
                  ) : (
                    <span className="submission-no-abnormal">없음</span>
                  )}
                  {cancelled && <span className="submission-cancelled">취소됨</span>}
                </span>
                <span className="submission-row-action">
                  <span>상세</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="m9 5 7 7-7 7" />
                  </svg>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
