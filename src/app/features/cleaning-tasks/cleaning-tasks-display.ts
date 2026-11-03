import type { CleaningTaskStatus } from './cleaning-tasks.types';
export const taskStatusLabel: Record<CleaningTaskStatus, string> = {
  PLANNED: '예정',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
  CANCELLED: '취소',
};
export function taskTime(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}
export function taskDateInput(value: string): string {
  return new Date(new Date(value).getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);
}
export function taskDateIso(value: string): string {
  const date = new Date(`${value}:00+09:00`);
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ||
    Number.isNaN(date.getTime())
  )
    throw new Error('작업 일시를 입력해 주세요.');
  return date.toISOString();
}
