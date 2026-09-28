import type { AdminSubmissionListInput } from '../../../../features/admin-submissions/admin-submissions.types';
import { isStayId } from '../../../../features/admin-stays/admin-stays-validation';

export type SubmissionDateErrors = Partial<Record<'from' | 'to', string>>;

export function readSubmissionListFilters(
  search: URLSearchParams,
): AdminSubmissionListInput {
  const rawPage = search.get('page') ?? '1';
  const page = /^\d{1,6}$/.test(rawPage) ? Number(rawPage) : 1;
  const propertyId = search.get('propertyId');
  const stayId = search.get('stayId');
  const type = search.get('type');
  const status = search.get('status');
  return {
    page: Number.isInteger(page) && page >= 1 && page <= 100000 ? page : 1,
    propertyId: isStayId(propertyId) ? propertyId.toLowerCase() : undefined,
    stayId: isStayId(stayId) ? stayId.toLowerCase() : undefined,
    type:
      type === 'CHECK_IN' || type === 'CHECK_OUT' || type === 'MAINTENANCE'
        ? type
        : undefined,
    status:
      status === 'SUBMITTED' || status === 'CANCELLED' ? status : undefined,
    // Keep invalid dates visible so a malformed URL never broadens the query silently.
    from: search.get('from') || undefined,
    to: search.get('to') || undefined,
  };
}

export function submissionListSearch(input: AdminSubmissionListInput): string {
  const raw = new URLSearchParams({ page: String(input.page) });
  for (const key of [
    'propertyId',
    'stayId',
    'type',
    'status',
    'from',
    'to',
  ] as const)
    if (input[key] !== undefined) raw.set(key, input[key]);
  const clean = readSubmissionListFilters(raw);
  const query = new URLSearchParams();
  for (const key of [
    'propertyId',
    'stayId',
    'type',
    'status',
    'from',
    'to',
  ] as const)
    if (clean[key] !== undefined) query.set(key, clean[key]);
  if (clean.page > 1) query.set('page', String(clean.page));
  return query.size ? `?${query}` : '';
}

function isVisitDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(timestamp) &&
    new Date(timestamp).toISOString().slice(0, 10) === value
  );
}

export function submissionDateErrors(
  input: Pick<AdminSubmissionListInput, 'from' | 'to'>,
): SubmissionDateErrors {
  const errors: SubmissionDateErrors = {};
  if (input.from && !isVisitDate(input.from))
    errors.from = '시작 방문일을 올바른 YYYY-MM-DD 날짜로 입력해 주세요.';
  if (input.to && !isVisitDate(input.to))
    errors.to = '종료 방문일을 올바른 YYYY-MM-DD 날짜로 입력해 주세요.';
  if (
    !errors.from &&
    !errors.to &&
    input.from &&
    input.to &&
    input.from > input.to
  )
    errors.to = '종료 방문일은 시작 방문일과 같거나 이후여야 합니다.';
  return errors;
}

export const submissionTypeLabel = {
  CHECK_IN: '입실',
  CHECK_OUT: '퇴실',
  MAINTENANCE: '정비',
} as const;

export function submissionTime(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(value));
}
