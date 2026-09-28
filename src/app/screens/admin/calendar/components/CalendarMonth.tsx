import type { CalendarDay } from '../model/calendar-model';
import '../styles/calendar-panels.css';

type CalendarMonthProps = {
  month: string;
  days: CalendarDay[];
  selectedDate: string;
  today: string;
  onSelect: (date: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  canPrevious: boolean;
  canNext: boolean;
  state?: 'ready' | 'loading' | 'error';
};

const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
});

function getDayLabel(day: CalendarDay, today: string) {
  const label = dateFormatter.format(new Date(`${day.date}T00:00:00Z`));
  return `${label}${day.date === today ? ', 오늘' : ''}, 입실 예정 ${day.arrivals}건, 퇴실 예정 ${day.departures}건, 연속 일정 ${day.continuing}건`;
}

export function CalendarMonth({
  month,
  days,
  selectedDate,
  today,
  onSelect,
  onPrevious,
  onNext,
  canPrevious,
  canNext,
  state = 'ready',
}: CalendarMonthProps) {
  const [year, monthNumber] = month.split('-');
  const leadingBlanks = new Date(`${month}-01T00:00:00Z`).getUTCDay();
  const trailingBlanks = (7 - ((leadingBlanks + days.length) % 7)) % 7;

  return (
    <section className="calendar-month" aria-labelledby="calendar-month-title">
      <div className="calendar-month__toolbar">
        <div>
          <span className="calendar-month__eyebrow">MONTHLY SCHEDULE</span>
          <h2 id="calendar-month-title">
            {year}년 {Number(monthNumber)}월
          </h2>
        </div>
        <nav className="calendar-month__navigation" aria-label="달력 월 이동">
          <button
            type="button"
            onClick={onPrevious}
            disabled={!canPrevious}
            aria-label="이전 달"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m14 6-6 6 6 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!canNext}
            aria-label="다음 달"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m10 6 6 6-6 6" />
            </svg>
          </button>
        </nav>
      </div>

      {state === 'ready' ? (
        <>
          <div className="calendar-month__weekdays" aria-hidden="true">
            {weekdays.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>
          <div
            className="calendar-month__days"
            role="group"
            aria-label="날짜 선택"
          >
            {Array.from({ length: leadingBlanks }, (_, index) => (
              <span
                className="calendar-month__blank"
                key={`leading-${index}`}
                aria-hidden="true"
              />
            ))}
            {days.map((day) => (
              <button
                className="calendar-month__day"
                type="button"
                key={day.date}
                onClick={() => onSelect(day.date)}
                aria-label={getDayLabel(day, today)}
                aria-pressed={day.date === selectedDate}
                aria-current={day.date === today ? 'date' : undefined}
              >
                <span className="calendar-month__number" aria-hidden="true">
                  {day.day}
                </span>
                <span className="calendar-month__events" aria-hidden="true">
                  {day.arrivals > 0 && (
                    <span className="calendar-month__event calendar-month__event--arrival">
                      입실{' '}
                      <strong>{day.arrivals.toLocaleString('ko-KR')}</strong>
                    </span>
                  )}
                  {day.departures > 0 && (
                    <span className="calendar-month__event calendar-month__event--departure">
                      퇴실{' '}
                      <strong>{day.departures.toLocaleString('ko-KR')}</strong>
                    </span>
                  )}
                  {day.continuing > 0 && (
                    <span className="calendar-month__event calendar-month__event--continuing">
                      연속{' '}
                      <strong>{day.continuing.toLocaleString('ko-KR')}</strong>
                    </span>
                  )}
                </span>
              </button>
            ))}
            {Array.from({ length: trailingBlanks }, (_, index) => (
              <span
                className="calendar-month__blank"
                key={`trailing-${index}`}
                aria-hidden="true"
              />
            ))}
          </div>
          <ul className="calendar-month__legend" aria-label="일정 표시 안내">
            <li>
              <span className="calendar-month__legend-dot calendar-month__legend-dot--arrival" />
              입실 예정
            </li>
            <li>
              <span className="calendar-month__legend-dot calendar-month__legend-dot--departure" />
              퇴실 예정
            </li>
            <li>
              <span className="calendar-month__legend-dot calendar-month__legend-dot--continuing" />
              연속 일정
            </li>
          </ul>
          <p className="calendar-month__note">
            연속 일정은 입실일과 퇴실일 사이의 이용 일정입니다.
          </p>
        </>
      ) : (
        <div className="calendar-month__state" role="status">
          {state === 'loading' ? (
            <>
              <span className="calendar-month__spinner" aria-hidden="true" />
              <p>선택한 달의 이용 일정을 불러오고 있습니다.</p>
            </>
          ) : (
            <p>이용 일정을 표시할 수 없습니다. 다시 불러와 주세요.</p>
          )}
        </div>
      )}
    </section>
  );
}
