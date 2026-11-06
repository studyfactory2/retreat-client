import { taskStatusLabel } from '../../../../features/cleaning-tasks/cleaning-tasks-display';
import { getSeoulToday } from '../../../../core/dates/seoul-date';
import type { CleaningTaskDto } from '../../../../features/cleaning-tasks/cleaning-tasks.types';

const dayFormat: Intl.DateTimeFormatOptions = {
  timeZone: 'Asia/Seoul',
  month: 'long',
  day: 'numeric',
  weekday: 'short',
};
const calendarDay = new Intl.DateTimeFormat('ko-KR', dayFormat);
const calendarDayWithYear = new Intl.DateTimeFormat('ko-KR', {
  ...dayFormat,
  year: 'numeric',
});
const clock = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function agendaDayLabel(date: Date, key: string, today: string) {
  const format =
    key.slice(0, 4) === today.slice(0, 4) ? calendarDay : calendarDayWithYear;
  return format.format(date);
}

export function agendaDateTime(value: string, now = new Date()) {
  const date = new Date(value);
  return (
    agendaDayLabel(date, getSeoulToday(date), getSeoulToday(now)) +
    ' ' +
    clock.format(date)
  );
}

export function agendaTime(value: string) {
  return clock.format(new Date(value));
}

export function staffTaskName(task: {
  source: CleaningTaskDto['source'] | 'STANDALONE';
}) {
  return task.source === 'AUTO' ? '퇴실 후 청소·정비' : '추가 정비';
}

export function staffTaskStatus(task: CleaningTaskDto) {
  if (task.status === 'IN_PROGRESS' && task.currentSubmissionId)
    return '작성 중';
  return taskStatusLabel[task.status];
}

export function groupStaffAgenda<T>(
  tasks: T[],
  timestamp: (task: T) => string,
  now = new Date(),
) {
  const today = getSeoulToday(now);
  const tomorrow = getSeoulToday(new Date(now.getTime() + 86_400_000));
  const groups = new Map<
    string,
    { date: string; label: string; relative: string; tasks: T[] }
  >();

  for (const task of tasks) {
    const due = new Date(timestamp(task));
    const date = getSeoulToday(due);
    let group = groups.get(date);
    if (!group) {
      group = {
        date,
        label: agendaDayLabel(due, date, today),
        relative: date === today ? '오늘' : date === tomorrow ? '내일' : '',
        tasks: [],
      };
      groups.set(date, group);
    }
    group.tasks.push(task);
  }
  return Array.from(groups.values());
}
