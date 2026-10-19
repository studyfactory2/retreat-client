import type { CSSProperties } from 'react';
import type { CalendarDay } from '../model/calendar-model';
import { buildCalendarWeeks, getPropertyColor } from '../model/calendar-lanes';
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
  return `${label}${day.date === today ? ', 오늘' : ''}, 일정 ${day.stays.length}건, 입실 예정 ${day.arrivals}건, 퇴실 예정 ${day.departures}건`;
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
  const weeks = buildCalendarWeeks(month, days);
  const properties = [
    ...new Map(
      days.flatMap((day) =>
        day.stays.map((stay) => [stay.property.id, stay.property] as const),
      ),
    ).values(),
  ].sort((left, right) => left.name.localeCompare(right.name, 'ko'));
  const selected = days.find((day) => day.date === selectedDate);

  function inspect(date: string) {
    onSelect(date);
    requestAnimationFrame(onInspectSelected);
  }

  return (
    <section className="calendar-month" aria-labelledby="calendar-month-title">
      <div className="calendar-month__toolbar">
        <h2 id="calendar-month-title">{year}년 {Number(monthNumber)}월</h2>
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
          <button type="button" onClick={onToday}>오늘</button>
        </nav>
      </div>
      {state === 'ready' ? (
        <>
          <div
            className="calendar-month__grid"
            role="group"
            aria-label="날짜와 이용 일정 선택"
          >
            <div className="calendar-month__weekdays" aria-hidden="true">
              {weekdays.map((weekday) => <span key={weekday}>{weekday}</span>)}
            </div>
            {weeks.map((week, index) => (
              <div
                className="calendar-month__week"
                key={index}
                style={{
                  gridTemplateRows: `40px repeat(3, var(--calendar-bar-height))${week.overflow.some(Boolean) ? ' 44px' : ''}`,
                }}
              >
                {week.days.map((day, column) => day ? (
                  <button
                    className="calendar-month__day"
                    type="button"
                    key={day.date}
                    style={{ gridColumn: column + 1 }}
                    onClick={() => onSelect(day.date)}
                    aria-label={getDayLabel(day, today)}
                    aria-pressed={day.date === selectedDate}
                    aria-current={day.date === today ? 'date' : undefined}
                    aria-controls="calendar-selected-title"
                  >
                    <span className="calendar-month__number" aria-hidden="true">
                      {day.day}
                    </span>
                  </button>
                ) : (
                  <span
                    className="calendar-month__blank"
                    key={`blank-${column}`}
                    style={{ gridColumn: column + 1 }}
                    aria-hidden="true"
                  />
                ))}
                {week.segments.map((segment) => {
                  const date = week.days[segment.start]!.date;
                  const label = `${segment.stay.property.name}, ${segment.stay.checkIn.expectedDate}부터 ${segment.stay.checkOut.expectedDate}까지`;
                  return (
                    <button
                      className={`calendar-month__bar${segment.continuesBefore ? ' calendar-month__bar--before' : ''}${segment.continuesAfter ? ' calendar-month__bar--after' : ''}`}
                      key={segment.stay.id}
                      type="button"
                      onClick={() => inspect(date)}
                      title={label}
                      aria-label={`${label}, ${date} 일정 보기`}
                      aria-controls="calendar-selected-title"
                      style={{
                        gridColumn: `${segment.start + 1} / ${segment.end + 2}`,
                        gridRow: segment.lane + 2,
                        '--property-color': getPropertyColor(segment.stay.property.id),
                      } as CSSProperties}
                    >
                      <span>{segment.stay.property.name}</span>
                    </button>
                  );
                })}
                {week.overflow.map((count, column) => count > 0 ? (
                  <button
                    className="calendar-month__overflow"
                    key={column}
                    type="button"
                    style={{ gridColumn: column + 1, gridRow: 5 }}
                    onClick={() => inspect(week.days[column]!.date)}
                    aria-label={`${week.days[column]!.date}, 추가 일정 ${count}건 포함 전체 일정 보기`}
                    aria-controls="calendar-selected-title"
                  >
                    +{count}
                  </button>
                ) : null)}
              </div>
            ))}
          </div>
          {properties.length > 0 && (
            <ul className="calendar-month__legend" aria-label="휴양소별 색상">
              {properties.map((property) => (
                <li key={property.id}>
                  <i
                    style={{ background: getPropertyColor(property.id) }}
                    aria-hidden="true"
                  />
                  {property.name}
                </li>
              ))}
            </ul>
          )}
          <div className="calendar-month__footer">
            <p className="calendar-month__note">입실일부터 퇴실일까지 · 한국 시간</p>
            <button
              className="calendar-month__inspect"
              type="button"
              onClick={onInspectSelected}
              aria-controls="calendar-selected-title"
            >
              선택일 {selected?.stays.length.toLocaleString('ko-KR') ?? '0'}건
              <span aria-hidden="true">↓</span>
            </button>
          </div>
        </>
      ) : (
        <div
          className="calendar-month__state"
          role="status"
          aria-busy={state === 'loading'}
        >
          {state === 'loading' && <span className="calendar-month__spinner" aria-hidden="true" />}
          <p>
            {state === 'loading'
              ? '일정을 불러오고 있습니다.'
              : '일정을 표시할 수 없습니다. 다시 불러와 주세요.'}
          </p>
        </div>
      )}
    </section>
  );
}
