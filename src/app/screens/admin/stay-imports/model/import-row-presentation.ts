import type { StayImportRowDto } from '../../../../features/admin-stay-imports/admin-stay-imports.types';
import { importRowStatus } from './import-review-model';

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function periodParts(value: string | null, date: string | null) {
  if (value && Number.isFinite(Date.parse(value))) {
    const parts = formatter.formatToParts(new Date(value));
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((entry) => entry.type === type)?.value ?? '';
    return {
      year: part('year'),
      date: `${part('month')}.${part('day')}`,
      time: `${part('hour')}:${part('minute')}`,
    };
  }
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const parsed = new Date(`${date}T00:00:00Z`);
    if (
      Number.isFinite(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === date
    ) {
      return {
        year: date.slice(0, 4),
        date: date.slice(5).replace('-', '.'),
        time: '',
      };
    }
  }
  return null;
}

/** Only omit the year when every dated endpoint on this page shares it. */
export function importRowsYear(rows: StayImportRowDto[]): string | undefined {
  const years = new Set<string>();
  for (const { normalizedData: data } of rows) {
    if (!data) continue;
    for (const parts of [
      periodParts(data.checkInAt, data.checkInDate),
      periodParts(data.checkOutAt, data.checkOutDate),
    ]) {
      if (parts) years.add(parts.year);
    }
  }
  return years.size === 1 ? [...years][0] : undefined;
}

export function importRowPeriod(
  value: string | null,
  date: string | null,
  sharedYear?: string,
): string {
  const parts = periodParts(value, date);
  if (!parts) return '일시 확인';
  const day = `${parts.year === sharedYear ? '' : `${parts.year}.`}${parts.date}`;
  return parts.time ? `${day} ${parts.time}` : day;
}

const actions: Record<string, { label: string; priority: number }> = {
  INVALID_DATES: { label: '날짜 확인', priority: 0 },
  INVALID_DATE_RANGE: { label: '날짜 확인', priority: 0 },
  MISSING_TIME: { label: '시간 입력', priority: 1 },
  MISSING_GUEST_NAME: { label: '이름 입력', priority: 2 },
  AMBIGUOUS_GUEST_COLUMNS: { label: '이름 확인', priority: 2 },
  MISSING_PHONE: { label: '연락처 확인', priority: 3 },
  INVALID_PHONE: { label: '연락처 확인', priority: 3 },
  FORMULA_OR_ERROR: { label: '원본 확인', priority: 4 },
  TEXT_TOO_LONG: { label: '내용 확인', priority: 4 },
  INVALID_STAY_DATA: { label: '내용 확인', priority: 4 },
  DUPLICATE_SOURCE_ROW: { label: '중복 확인', priority: 5 },
  POSSIBLE_EXISTING_DUPLICATE: { label: '중복 확인', priority: 5 },
  EXISTING_STAY_OVERLAP: { label: '일정 확인', priority: 5 },
  SOURCE_STAY_OVERLAP: { label: '일정 확인', priority: 5 },
  PROPERTY_NOT_MAPPED: { label: '휴양소 선택', priority: 6 },
  INACTIVE_PROPERTY: { label: '휴양소 확인', priority: 6 },
  RESOURCE_MISMATCH: { label: '휴양소 확인', priority: 6 },
  AMBIGUOUS_COMPANY: { label: '회사 확인', priority: 7 },
  HIDDEN_SHEET: { label: '시트 확인', priority: 7 },
  AMBIGUOUS_AVAILABILITY: { label: '내용 확인', priority: 7 },
};

export function importRowActionBadge(row: StayImportRowDto) {
  if (
    row.stayId ||
    row.action === 'SKIP' ||
    (row.action === 'CREATE' && row.validationStatus === 'VALID')
  ) {
    return { label: importRowStatus(row), additional: 0 };
  }
  if (row.action === 'UPDATE') return { label: '처리 확인', additional: 0 };
  // Count distinct server issues, not display labels: two issues may share a label.
  const messages = [
    ...new Map(
      row.validationMessages.map((entry) => [
        `${entry.code}:${entry.message}`,
        entry,
      ]),
    ).values(),
  ];
  const primary = messages
    .map((entry) =>
      Object.hasOwn(actions, entry.code)
        ? actions[entry.code]
        : { label: '내용 확인', priority: 4 },
    )
    .sort((a, b) => a.priority - b.priority)[0];
  if (primary) return { label: primary.label, additional: messages.length - 1 };
  const data = row.normalizedData;
  const label = !data
    ? '원본 확인'
    : !data.guestName
      ? '이름 입력'
      : !data.checkInAt || !data.checkOutAt
        ? data.checkInDate && data.checkOutDate
          ? '시간 입력'
          : '날짜 확인'
        : !row.propertyId
          ? '휴양소 선택'
          : '내용 확인';
  return { label, additional: 0 };
}
