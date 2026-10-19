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
  weekday: 'short',
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
            {stays.length.toLocaleString('ko-KR')}건
          </span>
        </div>
        {stays.length > 0 && (
          <p>
            입실 예정 {arrivals.toLocaleString('ko-KR')} · 퇴실 예정{' '}
            {departures.toLocaleString('ko-KR')}
          </p>
        )}
      </header>
      {stays.length > 0 ? (
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
      ) : (
        <div className="calendar-selected__empty">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="4" y="5" width="16" height="16" rx="3" />
            <path d="M8 3v4m8-4v4M4 11h16m-10 5h4" />
          </svg>
          <h3>등록된 일정이 없어요</h3>
          <p>다른 날짜나 휴양소를 선택해 주세요.</p>
        </div>
      )}
    </section>
  );
}
