import type { CalendarDay } from '../model/calendar-model';
import { buildCalendarWeeks, getPropertyColor } from '../model/calendar-lanes';
import { CalendarMonthGrid } from './CalendarMonthGrid';
import '../styles/calendar-panels.css';

type CalendarMonthProps = {
  month: string;
  days: CalendarDay[];
  selectedDate: string;
  today: string;
  returnSearch: string;
  onSelect: (date: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onInspectSelected: () => void;
  canPrevious: boolean;
  canNext: boolean;
  state?: 'ready' | 'loading' | 'error';
};

export function CalendarMonth({
  month,
  days,
  selectedDate,
  today,
  returnSearch,
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
  const compactWeeks = buildCalendarWeeks(month, days, 2);
  const wideWeeks = buildCalendarWeeks(month, days, 3);
  const properties = [
    ...new Map(
      days.flatMap((day) =>
        day.stays.map((stay) => [stay.property.id, stay.property] as const),
      ),
    ).values(),
  ].sort((left, right) => left.name.localeCompare(right.name, 'ko'));
  const selected = days.find((day) => day.date === selectedDate);
  const propertyLegend = (
    <ul
      className={`calendar-month__legend${properties.length === 1 ? ' calendar-month__legend--inline' : ''}`}
      aria-label="휴양소별 색상"
    >
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
  );

  function inspect(date: string) {
    onSelect(date);
    requestAnimationFrame(onInspectSelected);
  }

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
          <button type="button" onClick={onToday}>
            오늘
          </button>
        </nav>
      </div>
      {state === 'ready' ? (
        <>
          <CalendarMonthGrid
            weeks={compactWeeks}
            variant="compact"
            selectedDate={selectedDate}
            today={today}
            returnSearch={returnSearch}
            onSelect={onSelect}
            onInspect={inspect}
          />
          <CalendarMonthGrid
            weeks={wideWeeks}
            variant="wide"
            selectedDate={selectedDate}
            today={today}
            returnSearch={returnSearch}
            onSelect={onSelect}
            onInspect={inspect}
          />
          {properties.length === 1 ? (
            propertyLegend
          ) : properties.length > 1 ? (
            <details className="calendar-month__legend-disclosure">
              <summary>
                휴양소별 색상 <span>{properties.length}곳</span>
              </summary>
              {propertyLegend}
            </details>
          ) : null}
          <div className="calendar-month__footer">
            <p className="calendar-month__note">예정 일정 · 한국 시간</p>
            <button
              className="calendar-month__inspect"
              type="button"
              onClick={onInspectSelected}
              aria-controls="calendar-selected-title"
            >
              선택일 {selected?.stays.length.toLocaleString('ko-KR') ?? '0'}건
              보기
            </button>
          </div>
        </>
      ) : (
        <div
          className="calendar-month__state"
          role="status"
          aria-busy={state === 'loading'}
        >
          {state === 'loading' && (
            <span className="calendar-month__spinner" aria-hidden="true" />
          )}
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
