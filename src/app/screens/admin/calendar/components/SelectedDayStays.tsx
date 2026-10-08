import type { AdminCalendarStayDto } from '../../../../features/admin-calendar/admin-calendar.types';
import { CalendarStayRow } from './CalendarStayRow';
import '../styles/calendar-panels.css';

type SelectedDayStaysProps = {
  date: string;
  stays: AdminCalendarStayDto[];
  returnSearch: string;
};
const selectedDateFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'UTC',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
});

export function SelectedDayStays({
  date,
  stays,
  returnSearch,
}: SelectedDayStaysProps) {
  const selectedDate = selectedDateFormatter.format(
    new Date(`${date}T00:00:00Z`),
  );
  const arrivals = stays.filter(
    (stay) => stay.checkIn.expectedDate === date,
  ).length;
  const departures = stays.filter(
    (stay) => stay.checkOut.expectedDate === date,
  ).length;
  const continuing = stays.filter(
    (stay) =>
      stay.checkIn.expectedDate < date && stay.checkOut.expectedDate > date,
  ).length;
  return (
    <section
      className="calendar-selected"
      aria-labelledby="calendar-selected-title"
    >
      <header className="calendar-selected__heading">
        <div>
          <h2 id="calendar-selected-title" tabIndex={-1}>
            <time dateTime={date}>{selectedDate}</time>
          </h2>
          <span className="calendar-selected__count">
            일정 {stays.length.toLocaleString('ko-KR')}건
          </span>
        </div>
        <p>
          입실 예정 {arrivals.toLocaleString('ko-KR')} · 퇴실 예정{' '}
          {departures.toLocaleString('ko-KR')} · 연속 일정{' '}
          {continuing.toLocaleString('ko-KR')}
        </p>
      </header>
      {stays.length > 0 ? (
        <>
          <div
            className="calendar-selected__scroll"
            role="region"
            aria-label={`선택일 이용 일정 전체 ${stays.length}건`}
            tabIndex={0}
          >
            <ol className="calendar-selected__stays">
              {stays.map((stay) => (
                <li key={stay.id}>
                  <CalendarStayRow
                    stay={stay}
                    date={date}
                    returnSearch={returnSearch}
                  />
                </li>
              ))}
            </ol>
          </div>
          <p className="calendar-selected__note">
            전체 {stays.length.toLocaleString('ko-KR')}건 · 아래로 이동해 모든
            일정을 확인할 수 있습니다.
          </p>
        </>
      ) : (
        <div className="calendar-selected__empty">
          <h3>선택한 날짜의 일정이 없습니다</h3>
          <p>다른 날짜를 선택해 주세요.</p>
        </div>
      )}
    </section>
  );
}
