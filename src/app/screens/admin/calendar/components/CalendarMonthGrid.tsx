import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import type { CalendarDay } from '../model/calendar-model';
import { getPropertyColor, type CalendarWeek } from '../model/calendar-lanes';

type CalendarMonthGridProps = {
  weeks: CalendarWeek[];
  variant: 'compact' | 'wide';
  selectedDate: string;
  today: string;
  returnSearch: string;
  onSelect: (date: string) => void;
  onInspect: (date: string) => void;
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

export function CalendarMonthGrid({
  weeks,
  variant,
  selectedDate,
  today,
  returnSearch,
  onSelect,
  onInspect,
}: CalendarMonthGridProps) {
  return (
    <div
      className={`calendar-month__grid calendar-month__grid--${variant}`}
      role="group"
      aria-label="날짜와 이용 일정 선택"
    >
      <div className="calendar-month__weekdays" aria-hidden="true">
        {weekdays.map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>
      {weeks.map((week, index) => (
        <div
          className="calendar-month__week"
          key={index}
          style={{
            gridTemplateRows: `var(--calendar-day-height)${week.laneCount ? ` repeat(${week.laneCount}, var(--calendar-bar-height))` : ''}${week.overflow.some(Boolean) ? ' 44px' : ''}`,
          }}
        >
          {week.days.map((day, column) => (
            <span
              className={`calendar-month__cell${day ? '' : ' calendar-month__cell--blank'}`}
              key={`cell-${column}`}
              style={{ gridColumn: column + 1, gridRow: '1 / -1' }}
              aria-hidden="true"
            />
          ))}
          {week.days.map((day, column) =>
            day ? (
              <button
                className="calendar-month__day"
                type="button"
                key={day.date}
                style={{ gridColumn: column + 1, gridRow: 1 }}
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
            ) : null,
          )}
          {week.segments.map((segment) => {
            const label = `${segment.stay.property.name}, ${segment.stay.checkIn.expectedDate}부터 ${segment.stay.checkOut.expectedDate}까지`;
            const className = `calendar-month__bar${segment.continuesBefore ? ' calendar-month__bar--before' : ''}${segment.continuesAfter ? ' calendar-month__bar--after' : ''}`;
            const style = {
              gridColumn: `${segment.start + 1} / ${segment.end + 2}`,
              gridRow: segment.lane + 2,
              '--property-color': getPropertyColor(segment.stay.property.id),
            } as CSSProperties;
            const startDate = week.days[segment.start]!.date;
            const endDate = week.days[segment.end]!.date;
            const inspectDate =
              selectedDate >= startDate && selectedDate <= endDate
                ? selectedDate
                : startDate;

            return variant === 'compact' ? (
              <button
                className={className}
                key={segment.stay.id}
                type="button"
                style={style}
                title={label}
                onClick={() => onInspect(inspectDate)}
                aria-label={`${label}, ${inspectDate} 전체 일정 보기`}
                aria-controls="calendar-selected-title"
              >
                <span>{segment.stay.property.name}</span>
              </button>
            ) : (
              <Link
                className={className}
                key={segment.stay.id}
                to={`/admin/stays/${segment.stay.id}${returnSearch}`}
                title={label}
                aria-label={`${label}, 이용 일정 상세 보기`}
                style={style}
              >
                <span>{segment.stay.property.name}</span>
              </Link>
            );
          })}
          {week.overflow.map((count, column) =>
            count > 0 ? (
              <button
                className="calendar-month__overflow"
                key={column}
                type="button"
                style={{
                  gridColumn: column + 1,
                  gridRow: week.laneCount + 2,
                }}
                onClick={() => onInspect(week.days[column]!.date)}
                aria-label={`${week.days[column]!.date}, 추가 일정 ${count}건 포함 전체 일정 보기`}
                aria-controls="calendar-selected-title"
              >
                +{count}
              </button>
            ) : null,
          )}
        </div>
      ))}
    </div>
  );
}
