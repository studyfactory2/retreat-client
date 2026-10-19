import type { AdminCalendarPageData } from '../../../../features/admin-calendar/admin-calendar.types';
import { ScheduleIcon } from './ScheduleIcon';

export function ScheduleStats({
  data,
  loading,
}: {
  data?: AdminCalendarPageData;
  loading: boolean;
}) {
  const pageCount = data?.items.length ?? 0;
  const metrics = [
    {
      label: '기간 내 일정',
      count: data?.total,
      scope: '선택 기간 · 전체 일정',
      icon: 'calendar' as const,
    },
    {
      label: '입실 제출',
      count: data?.items.filter(
        (stay) => stay.checkIn.status === 'SUBMITTED',
      ).length,
      scope: '현재 페이지 기준',
      icon: 'check' as const,
      fraction: true,
    },
    {
      label: '퇴실 제출',
      count: data?.items.filter(
        (stay) => stay.checkOut.status === 'SUBMITTED',
      ).length,
      scope: '현재 페이지 기준',
      icon: 'check' as const,
      fraction: true,
    },
  ];

  return (
    <section
      className="schedule-stats"
      aria-label="이용 일정 요약"
      aria-busy={loading || undefined}
    >
      {metrics.map((metric) => (
        <div className="schedule-stat" key={metric.label}>
          <div className="schedule-stat__heading">
            <span>{metric.label}</span>
            <ScheduleIcon name={metric.icon} />
          </div>
          <p className="schedule-stat__value">
            {metric.count === undefined ? (
              <span aria-label={loading ? '불러오는 중' : '조회되지 않음'}>
                —
              </span>
            ) : (
              <>
                <strong>{metric.count.toLocaleString('ko-KR')}</strong>
                {metric.fraction && pageCount > 0 && (
                  <span className="schedule-stat__denominator"> / {pageCount}</span>
                )}
                <span className="schedule-stat__unit">건</span>
              </>
            )}
          </p>
          <p className="schedule-stat__scope">{metric.scope}</p>
        </div>
      ))}
    </section>
  );
}
