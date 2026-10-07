import { Link } from 'react-router-dom';
import type { DashboardChecklistCounts } from '../../../../features/admin-dashboard/admin-dashboard.types';

export function DashboardChecklistSummary({
  title,
  counts,
  calendarLink,
}: {
  title: string;
  counts: DashboardChecklistCounts;
  calendarLink: string;
}) {
  const statuses = [
    { label: '제출 완료', count: counts.submitted, tone: 'blue' },
    { label: '미제출', count: counts.notSubmitted, tone: 'amber' },
    { label: '확인 필요', count: counts.needsReview, tone: 'red' },
    { label: '작성 예정', count: counts.scheduled, tone: 'muted' },
  ];
  return (
    <article className="dashboard-checklist">
      <Link
        className="dashboard-checklist__heading"
        to={calendarLink}
        aria-label={`${title} ${counts.total.toLocaleString('ko-KR')}건 · 선택일 일정 보기`}
      >
        <h3>{title}</h3>
        <span className="dashboard-checklist__total">
          <strong>{counts.total.toLocaleString('ko-KR')}</strong>건
          <span aria-hidden="true">↗</span>
        </span>
      </Link>
      <p className="dashboard-checklist__label">체크리스트 제출 현황</p>
      <dl className="dashboard-checklist__counts">
        {statuses.map(({ label, count, tone }) => (
          <div key={label} className={`dashboard-checklist__status--${tone}`}>
            <dt>{label}</dt>
            <dd>
              {count.toLocaleString('ko-KR')}
              <span>건</span>
            </dd>
          </div>
        ))}
      </dl>
      {counts.total === 0 && (
        <p className="dashboard-empty">예정된 일정이 없습니다.</p>
      )}
    </article>
  );
}
