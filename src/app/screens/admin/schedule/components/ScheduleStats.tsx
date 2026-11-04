import type { AdminCalendarPageData } from '../../../../features/admin-calendar/admin-calendar.types';

export function ScheduleStats({
  data,
  loading,
}: {
  data?: AdminCalendarPageData;
  loading: boolean;
}) {
  if (data?.items.length === 0) return null;
  const total = data?.items.length;
  const counts = [
    {
      label: '입실',
      count: data?.items.filter((stay) => stay.checkIn.status === 'SUBMITTED')
        .length,
    },
    {
      label: '퇴실',
      count: data?.items.filter((stay) => stay.checkOut.status === 'SUBMITTED')
        .length,
    },
  ];
  return (
    <section
      className="schedule-stats"
      aria-label="현재 페이지의 체크리스트 제출 현황"
      aria-busy={loading || undefined}
    >
      <span className="schedule-stats__scope">이 페이지 제출</span>
      {counts.map(({ label, count }) => (
        <span className="schedule-stat" key={label}>
          <span>{label}</span>
          {count === undefined || total === undefined ? (
            <span aria-label={loading ? '불러오는 중' : '조회되지 않음'}>
              —
            </span>
          ) : (
            <strong aria-label={`${total}건 중 ${count}건 제출`}>
              {count}
              <span> / {total}</span>
            </strong>
          )}
        </span>
      ))}
    </section>
  );
}
