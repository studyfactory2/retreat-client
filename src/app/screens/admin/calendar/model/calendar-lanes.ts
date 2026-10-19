import type { AdminCalendarStayDto } from '../../../../features/admin-calendar/admin-calendar.types';
import type { CalendarDay } from './calendar-model';

const propertyColors = [
  '#2b5adf',
  '#28785d',
  '#996113',
  '#7650a8',
  '#a64f64',
  '#247787',
];

export function getPropertyColor(propertyId: string): string {
  let hash = 0;
  for (const character of propertyId)
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return propertyColors[hash % propertyColors.length];
}

export interface CalendarSegment {
  stay: AdminCalendarStayDto;
  start: number;
  end: number;
  lane: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
}

export interface CalendarWeek {
  days: Array<CalendarDay | null>;
  segments: CalendarSegment[];
  laneCount: number;
  overflow: number[];
}

/** Stable interval packing with an inclusive checkout date and no overwritten lanes. */
export function buildCalendarWeeks(
  month: string,
  days: CalendarDay[],
  visibleLanes = 3,
): CalendarWeek[] {
  if (days.length === 0) return [];
  const firstWeekday = new Date(`${month}-01T00:00:00Z`).getUTCDay();
  const cells: Array<CalendarDay | null> = Array.from(
    { length: firstWeekday },
    () => null,
  );
  cells.push(...days);
  while (cells.length % 7) cells.push(null);
  const unique = new Map(
    days.flatMap((day) => day.stays.map((stay) => [stay.id, stay] as const)),
  );
  const stays = [...unique.values()].sort(
    (left, right) =>
      left.checkIn.expectedDate.localeCompare(right.checkIn.expectedDate) ||
      right.checkOut.expectedDate.localeCompare(left.checkOut.expectedDate) ||
      left.property.id.localeCompare(right.property.id) ||
      left.id.localeCompare(right.id),
  );
  const lastDay = days.at(-1)!.date;
  const laneEnds: string[] = [];
  const allocated = stays.map((stay) => {
    const startDate =
      stay.checkIn.expectedDate < days[0].date
        ? days[0].date
        : stay.checkIn.expectedDate;
    const endDate =
      stay.checkOut.expectedDate > lastDay
        ? lastDay
        : stay.checkOut.expectedDate;
    let lane = laneEnds.findIndex((end) => end < startDate);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = endDate;
    return {
      stay,
      lane,
      start: firstWeekday + Number(startDate.slice(8)) - 1,
      end: firstWeekday + Number(endDate.slice(8)) - 1,
    };
  });
  const weeks: CalendarWeek[] = [];
  for (let offset = 0; offset < cells.length; offset += 7) {
    const segments: CalendarSegment[] = [];
    const overflow = Array<number>(7).fill(0);
    for (const event of allocated) {
      if (event.end < offset || event.start > offset + 6) continue;
      const start = Math.max(0, event.start - offset);
      const end = Math.min(6, event.end - offset);
      if (event.lane >= visibleLanes) {
        for (let day = start; day <= end; day++) overflow[day] += 1;
      } else {
        segments.push({
          stay: event.stay,
          start,
          end,
          lane: event.lane,
          continuesBefore:
            event.start < offset ||
            event.stay.checkIn.expectedDate < days[0].date,
          continuesAfter:
            event.end > offset + 6 ||
            event.stay.checkOut.expectedDate > lastDay,
        });
      }
    }
    weeks.push({
      days: cells.slice(offset, offset + 7),
      segments,
      overflow,
      laneCount: Math.max(1, ...segments.map((segment) => segment.lane + 1)),
    });
  }
  return weeks;
}
