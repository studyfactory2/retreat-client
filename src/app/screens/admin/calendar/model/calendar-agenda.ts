import type { AdminCalendarStayDto } from '../../../../features/admin-calendar/admin-calendar.types';

export interface CalendarTimedEvent {
  key: string;
  kind: 'arrival' | 'departure';
  at: string;
  stay: AdminCalendarStayDto;
}

export interface CalendarContinuingEvent {
  key: string;
  kind: 'continuing';
  stay: AdminCalendarStayDto;
}

export type CalendarAgendaEntry = CalendarTimedEvent | CalendarContinuingEvent;

function compareStays(left: AdminCalendarStayDto, right: AdminCalendarStayDto) {
  return (
    left.property.name.localeCompare(right.property.name, 'ko') ||
    left.guestName.localeCompare(right.guestName, 'ko') ||
    left.property.id.localeCompare(right.property.id) ||
    left.id.localeCompare(right.id)
  );
}

/** Expected Seoul dates classify events; exact timestamps order that day's work. */
export function buildDayAgenda(date: string, stays: AdminCalendarStayDto[]) {
  const selected = [
    ...new Map(stays.map((stay) => [stay.id, stay])).values(),
  ].filter(
    (stay) =>
      stay.checkIn.expectedDate <= date && stay.checkOut.expectedDate >= date,
  );
  const timed: CalendarTimedEvent[] = [];
  const continuing: CalendarContinuingEvent[] = [];
  let arrivals = 0;
  let departures = 0;

  for (const stay of selected) {
    const arrives = stay.checkIn.expectedDate === date;
    const departs = stay.checkOut.expectedDate === date;
    if (arrives) {
      arrivals += 1;
      timed.push({
        key: `${stay.id}:arrival`,
        kind: 'arrival',
        at: stay.checkInAt,
        stay,
      });
    }
    if (departs) {
      departures += 1;
      timed.push({
        key: `${stay.id}:departure`,
        kind: 'departure',
        at: stay.checkOutAt,
        stay,
      });
    }
    if (!arrives && !departs) {
      continuing.push({
        key: `${stay.id}:continuing`,
        kind: 'continuing',
        stay,
      });
    }
  }

  timed.sort(
    (left, right) =>
      Date.parse(left.at) - Date.parse(right.at) ||
      (left.kind === right.kind ? 0 : left.kind === 'departure' ? -1 : 1) ||
      compareStays(left.stay, right.stay),
  );
  continuing.sort((left, right) => compareStays(left.stay, right.stay));

  // Arrival/departure event totals can overlap for a same-day stay.
  return { total: selected.length, arrivals, departures, timed, continuing };
}
