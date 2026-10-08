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
  onToday: () => void;
  onInspectSelected: () => void;
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
  return `${label}${day.date === today ? ', 오늘' : ''}, 일정 ${day.stays.length}건, 입실 예정 ${day.arrivals}건, 퇴실 예정 ${day.departures}건, 연속 일정 ${day.continuing}건`;
}

export function CalendarMonth({
  month,
  days,
  selectedDate,
  today,
  onSelect,
  onPrevious,
  onNext,
  onToday,
  onInspectSelected,
  canPrevious,
  canNext,
  state = 'ready',
}: CalendarMonthProps) {
  const [year, monthNumber] = month.split('-');
  const leadingBlanks = new Date(`${month}-01T00:00:00Z`).getUTCDay();
  const trailingBlanks = (7 - ((leadingBlanks + days.length) % 7)) % 7;
  const selected = days.find((day) => day.date === selectedDate);

  return (
    <section className="calendar-month" aria-labelledby="calendar-month-title">
      <div className="calendar-month__toolbar">
        <h2 id="calendar-month-title">
          {year}년 {Number(monthNumber)}월
        </h2>
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
          <button type="button" onClick={onToday}>
            오늘
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
                aria-controls="calendar-selected-title"
              >
                <span className="calendar-month__number" aria-hidden="true">
                  {day.day}
                </span>
                {day.stays.length > 0 && (
                  <span className="calendar-month__summary" aria-hidden="true">
                    <span className="calendar-month__count">
                      <strong>
                        {day.stays.length.toLocaleString('ko-KR')}
                      </strong>
                      건
                    </span>
                    <span className="calendar-month__markers">
                      {day.arrivals > 0 && (
                        <span className="calendar-month__legend-dot calendar-month__legend-dot--arrival" />
                      )}
                      {day.departures > 0 && (
                        <span className="calendar-month__legend-dot calendar-month__legend-dot--departure" />
                      )}
                      {day.continuing > 0 && (
                        <span className="calendar-month__legend-dot calendar-month__legend-dot--continuing" />
                      )}
                    </span>
                  </span>
                )}
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
            숫자는 해당 날짜의 일정 수입니다. 연속 일정은 입·퇴실일 사이의
            일정입니다.
          </p>
          <button
            className="calendar-month__inspect"
            type="button"
            onClick={onInspectSelected}
            aria-controls="calendar-selected-title"
          >
            선택한 날짜의 일정{' '}
            {selected?.stays.length.toLocaleString('ko-KR') ?? '0'}건 보기{' '}
            <span aria-hidden="true">↓</span>
          </button>
        </>
      ) : (
        <div
          className="calendar-month__state"
          role="status"
          aria-busy={state === 'loading'}
        >
          <p>
            {state === 'loading'
              ? '선택한 달의 일정을 불러오고 있습니다.'
              : '일정을 표시할 수 없습니다. 다시 불러와 주세요.'}
          </p>
        </div>
      )}
    </section>
  );
}
