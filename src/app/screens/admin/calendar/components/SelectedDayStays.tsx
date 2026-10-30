import type { AdminCalendarStayDto } from '../../../../features/admin-calendar/admin-calendar.types';
import { buildDayAgenda } from '../model/calendar-agenda';
import { CalendarStayRow } from './CalendarStayRow';
import '../styles/calendar-agenda.css';

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
  const agenda = buildDayAgenda(date, stays);
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
            일정 {agenda.total.toLocaleString('ko-KR')}건
          </span>
        </div>
        {agenda.total > 0 && (
          <ul
            className="calendar-selected__summary"
            aria-label="선택일 예정 일정"
          >
            <li className="calendar-selected__summary--arrival">
              입실 <strong>{agenda.arrivals.toLocaleString('ko-KR')}</strong>
            </li>
            <li className="calendar-selected__summary--departure">
              퇴실 <strong>{agenda.departures.toLocaleString('ko-KR')}</strong>
            </li>
            <li>
              연속{' '}
              <strong>
                {agenda.continuing.length.toLocaleString('ko-KR')}
              </strong>
            </li>
          </ul>
        )}
      </header>
      {agenda.total > 0 ? (
        <>
          {agenda.timed.length > 0 && (
            <ol
              className="calendar-selected__stays"
              aria-label="시간순 입실·퇴실 예정"
            >
              {agenda.timed.map((entry) => (
                <li key={entry.key}>
                  <CalendarStayRow entry={entry} returnSearch={returnSearch} />
                </li>
              ))}
            </ol>
          )}
          {agenda.continuing.length > 0 && (
            <section
              className="calendar-selected__continuing"
              aria-label="연속 일정"
            >
              <h3>
                연속 일정{' '}
                <span>
                  {agenda.continuing.length.toLocaleString('ko-KR')}건
                </span>
              </h3>
              <ul className="calendar-selected__stays">
                {agenda.continuing.map((entry) => (
                  <li key={entry.key}>
                    <CalendarStayRow
                      entry={entry}
                      returnSearch={returnSearch}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
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
