import { apiRequest } from '../../core/api/api-client';
import { ApiRequestError } from '../../core/api/api-error';
import { isCalendarDate, isCalendarPropertyId } from './admin-calendar-filters';
import type {
  AdminCalendarData,
  AdminCalendarInput,
  AdminCalendarStayDto,
  CalendarChecklistDto,
  CalendarChecklistStatus,
  CalendarReviewReason,
} from './admin-calendar.types';

const PAGE_LIMIT = 100;
const MAX_PAGE = 100_000;
const DAY_MS = 24 * 60 * 60 * 1_000;
const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1_000;
const CHECKLIST_STATUSES: ReadonlySet<string> = new Set([
  'SCHEDULED',
  'NOT_SUBMITTED',
  'SUBMITTED',
  'NEEDS_REVIEW',
]);
const REVIEW_REASONS: ReadonlySet<string> = new Set([
  'DUPLICATE_SUBMISSIONS',
  'STAY_CHANGED',
  'VISIT_DATE_MISMATCH',
  'MISSING_MATCH_CONTEXT',
  'INVALID_SUBMISSION_RECORD',
]);

interface CalendarPage extends AdminCalendarData {
  totalPages: number;
}

function invalidResponse(): ApiRequestError {
  return new ApiRequestError(
    '이용 일정을 확인할 수 없습니다. 다시 조회해 주세요.',
    200,
    'INVALID_CALENDAR_RESPONSE',
  );
}

function changedResponse(): ApiRequestError {
  return new ApiRequestError(
    '조회 중 이용 일정이나 기준 날짜가 변경되었습니다. 다시 조회해 주세요.',
    200,
    'CALENDAR_CHANGED',
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isId(value: unknown): value is string {
  return typeof value === 'string' && isCalendarPropertyId(value);
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const timestamp = Date.parse(value);
  return (
    Number.isFinite(timestamp) &&
    Number.isFinite(new Date(timestamp + SEOUL_OFFSET_MS).getTime()) &&
    new Date(timestamp).toISOString() === value
  );
}

function seoulDate(timestamp: string): string {
  return new Date(Date.parse(timestamp) + SEOUL_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}

function readChecklist(
  value: unknown,
  type: CalendarChecklistDto['type'],
  expectedDate: string,
  today: string,
): CalendarChecklistDto {
  if (
    !isRecord(value) ||
    value.type !== type ||
    value.expectedDate !== expectedDate ||
    typeof value.status !== 'string' ||
    !CHECKLIST_STATUSES.has(value.status) ||
    !isCount(value.submissionCount) ||
    (value.submissionId !== null && !isId(value.submissionId)) ||
    !Array.isArray(value.reviewReasons) ||
    !value.reviewReasons.every(
      (reason) => typeof reason === 'string' && REVIEW_REASONS.has(reason),
    ) ||
    new Set(value.reviewReasons).size !== value.reviewReasons.length
  )
    throw invalidResponse();

  const { submissionCount, status, submissionId, reviewReasons } = value;
  if (submissionCount === 0) {
    if (
      submissionId !== null ||
      reviewReasons.length !== 0 ||
      status !== (expectedDate > today ? 'SCHEDULED' : 'NOT_SUBMITTED')
    )
      throw invalidResponse();
  } else if (submissionCount > 1) {
    if (
      submissionId !== null ||
      status !== 'NEEDS_REVIEW' ||
      reviewReasons.length !== 1 ||
      reviewReasons[0] !== 'DUPLICATE_SUBMISSIONS'
    )
      throw invalidResponse();
  } else if (status === 'SUBMITTED') {
    if (submissionId === null || reviewReasons.length !== 0)
      throw invalidResponse();
  } else if (
    status !== 'NEEDS_REVIEW' ||
    reviewReasons.length === 0 ||
    reviewReasons.includes('DUPLICATE_SUBMISSIONS') ||
    (submissionId === null &&
      !reviewReasons.includes('INVALID_SUBMISSION_RECORD'))
  )
    throw invalidResponse();

  return {
    type,
    expectedDate,
    status: status as CalendarChecklistStatus,
    submissionCount,
    submissionId: submissionId?.toLowerCase() ?? null,
    reviewReasons: [...reviewReasons] as CalendarReviewReason[],
  };
}

function readStay(
  value: unknown,
  input: AdminCalendarInput,
  today: string,
): AdminCalendarStayDto {
  if (
    !isRecord(value) ||
    !isId(value.id) ||
    !isRecord(value.property) ||
    !isId(value.property.id) ||
    !isText(value.property.name) ||
    (value.property.region !== null &&
      typeof value.property.region !== 'string') ||
    typeof value.property.isActive !== 'boolean' ||
    !isText(value.guestName) ||
    !isTimestamp(value.checkInAt) ||
    !isTimestamp(value.checkOutAt) ||
    !isCount(value.currentRevision) ||
    value.currentRevision < 1 ||
    value.currentRevision > 2_147_483_647
  )
    throw invalidResponse();

  const start = Date.parse(`${input.from}T00:00:00.000Z`) - SEOUL_OFFSET_MS;
  const end =
    Date.parse(`${input.to}T00:00:00.000Z`) + DAY_MS - SEOUL_OFFSET_MS;
  const checkIn = Date.parse(value.checkInAt);
  const checkOut = Date.parse(value.checkOutAt);
  if (
    checkIn >= checkOut ||
    checkIn >= end ||
    checkOut < start ||
    (input.propertyId !== undefined &&
      value.property.id.toLowerCase() !== input.propertyId.toLowerCase())
  )
    throw invalidResponse();

  return {
    id: value.id.toLowerCase(),
    property: {
      id: value.property.id.toLowerCase(),
      name: value.property.name,
      region: value.property.region,
      isActive: value.property.isActive,
    },
    guestName: value.guestName,
    checkInAt: value.checkInAt,
    checkOutAt: value.checkOutAt,
    currentRevision: value.currentRevision,
    checkIn: readChecklist(
      value.checkIn,
      'CHECK_IN',
      seoulDate(value.checkInAt),
      today,
    ),
    checkOut: readChecklist(
      value.checkOut,
      'CHECK_OUT',
      seoulDate(value.checkOutAt),
      today,
    ),
  };
}

function readPage(
  value: unknown,
  input: AdminCalendarInput,
  page: number,
): CalendarPage {
  if (
    !isRecord(value) ||
    value.from !== input.from ||
    value.to !== input.to ||
    value.timezone !== 'Asia/Seoul' ||
    !isTimestamp(value.asOf) ||
    typeof value.today !== 'string' ||
    !isCalendarDate(value.today) ||
    seoulDate(value.asOf) !== value.today ||
    !Array.isArray(value.items) ||
    value.page !== page ||
    value.limit !== PAGE_LIMIT ||
    !isCount(value.total) ||
    !isCount(value.totalPages) ||
    value.totalPages !== Math.ceil(value.total / PAGE_LIMIT) ||
    value.totalPages > MAX_PAGE ||
    (page > 1 && page > value.totalPages) ||
    value.items.length !==
      Math.min(PAGE_LIMIT, value.total - (page - 1) * PAGE_LIMIT)
  )
    throw invalidResponse();
  const today = value.today;
  return {
    from: input.from,
    to: input.to,
    timezone: 'Asia/Seoul',
    asOf: value.asOf,
    today,
    items: value.items.map((item) => readStay(item, input, today)),
    total: value.total,
    totalPages: value.totalPages,
  };
}

export async function getAdminCalendar(
  input: AdminCalendarInput,
  token: string,
  signal?: AbortSignal,
): Promise<AdminCalendarData> {
  const days = (Date.parse(input.to) - Date.parse(input.from)) / DAY_MS + 1;
  if (
    !isCalendarDate(input.from) ||
    !isCalendarDate(input.to) ||
    days < 1 ||
    days > 62 ||
    (input.propertyId !== undefined && !isCalendarPropertyId(input.propertyId))
  )
    throw new ApiRequestError(
      '조회 날짜와 휴양소를 확인해 주세요. 조회 기간은 최대 62일입니다.',
      400,
      'INVALID_CALENDAR_FILTER',
    );

  const items: AdminCalendarStayDto[] = [];
  const ids = new Set<string>();
  let firstPage: CalendarPage | undefined;
  let lastPage: CalendarPage;
  let page = 1;
  do {
    signal?.throwIfAborted();
    const query = new URLSearchParams({
      from: input.from,
      to: input.to,
      page: String(page),
      limit: String(PAGE_LIMIT),
    });
    if (input.propertyId !== undefined)
      query.set('propertyId', input.propertyId.toLowerCase());
    const value = await apiRequest<unknown>(
      `/admin/calendar?${query.toString()}`,
      {
        token,
        signal,
      },
    );
    lastPage = readPage(value, input, page);
    if (
      firstPage &&
      (lastPage.total !== firstPage.total ||
        lastPage.totalPages !== firstPage.totalPages ||
        lastPage.today !== firstPage.today)
    )
      throw changedResponse();
    firstPage ??= lastPage;
    for (const stay of lastPage.items) {
      const previous = items.at(-1);
      if (
        ids.has(stay.id) ||
        (previous &&
          (Date.parse(stay.checkInAt) < Date.parse(previous.checkInAt) ||
            (stay.checkInAt === previous.checkInAt && stay.id <= previous.id)))
      )
        throw changedResponse();
      ids.add(stay.id);
      items.push(stay);
    }
    page += 1;
  } while (page <= firstPage.totalPages);

  signal?.throwIfAborted();
  return {
    from: input.from,
    to: input.to,
    timezone: 'Asia/Seoul',
    asOf: lastPage.asOf,
    today: lastPage.today,
    items,
    total: lastPage.total,
  };
}
