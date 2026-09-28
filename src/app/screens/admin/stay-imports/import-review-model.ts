import type { CreateAdminStayInput } from '../../../features/admin-stays/admin-stays.types';
import { isStayId } from '../../../features/admin-stays/admin-stays-validation';
import type {
  GetStayImportInput,
  StayImportRowDto,
} from '../../../features/admin-stay-imports/admin-stay-imports.types';

export type ImportRowValues = Record<
  | 'propertyId'
  | 'guestName'
  | 'company'
  | 'department'
  | 'phone'
  | 'notes'
  | 'checkInAt'
  | 'checkOutAt',
  string
>;
export type ImportRowErrors = Partial<Record<keyof ImportRowValues, string>>;

export function readImportFilters(search: URLSearchParams): GetStayImportInput {
  const rawPage = search.get('page') ?? '1';
  const page = /^\d{1,6}$/.test(rawPage) ? Number(rawPage) : 1;
  const status = search.get('validationStatus');
  const action = search.get('action');
  return {
    page: Number.isInteger(page) && page >= 1 && page <= 100000 ? page : 1,
    ...(status === 'VALID' || status === 'NEEDS_REVIEW' || status === 'INVALID'
      ? { validationStatus: status }
      : {}),
    ...(action === 'CREATE' || action === 'SKIP' || action === 'UPDATE'
      ? { action }
      : {}),
  };
}

export function importFilterSearch(input: GetStayImportInput): string {
  const query = new URLSearchParams();
  if (input.page > 1) query.set('page', String(input.page));
  if (input.validationStatus)
    query.set('validationStatus', input.validationStatus);
  if (input.action) query.set('action', input.action);
  return query.toString();
}

export function importTime(value: string | null): string {
  if (!value) return '시간 확인 필요';
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

function localTimestamp(value: string | null | undefined): string {
  return value
    ? new Date(Date.parse(value) + 9 * 3600000).toISOString().slice(0, -1)
    : '';
}

export function importRowValues(row: StayImportRowDto): ImportRowValues {
  const data = row.normalizedData;
  return {
    propertyId: row.propertyId ?? '',
    guestName: data?.guestName ?? '',
    company: data?.company ?? '',
    department: data?.department ?? '',
    phone: data?.phone ?? '',
    notes: data?.notes ?? '',
    checkInAt: localTimestamp(data?.checkInAt),
    checkOutAt: localTimestamp(data?.checkOutAt),
  };
}

function validLocal(value: string): boolean {
  if (
    !/^[1-9]\d{3}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?$/.test(
      value,
    )
  )
    return false;
  const parsed = Date.parse(`${value}Z`);
  if (!Number.isFinite(parsed)) return false;
  const canonical = new Date(parsed).toISOString();
  return canonical.slice(0, 16) === value.slice(0, 16);
}

export function validateImportRow(values: ImportRowValues): ImportRowErrors {
  const errors: ImportRowErrors = {};
  if (!isStayId(values.propertyId))
    errors.propertyId = '휴양소를 선택해 주세요.';
  if (!values.guestName.trim())
    errors.guestName = '이용객 이름을 입력해 주세요.';
  const limits = {
    guestName: 100,
    company: 100,
    department: 100,
    phone: 32,
    notes: 2000,
  } as const;
  for (const [field, max] of Object.entries(limits) as [
    keyof typeof limits,
    number,
  ][]) {
    if ([...values[field].trim()].length > max)
      errors[field] = `${max.toLocaleString('ko-KR')}자 이하로 입력해 주세요.`;
  }
  for (const field of ['checkInAt', 'checkOutAt'] as const)
    if (!validLocal(values[field]))
      errors[field] = '날짜와 시간을 모두 입력해 주세요. 한국 시간 기준입니다.';
  if (
    !errors.checkInAt &&
    !errors.checkOutAt &&
    Date.parse(`${values.checkOutAt}+09:00`) <=
      Date.parse(`${values.checkInAt}+09:00`)
  )
    errors.checkOutAt = '퇴실 일시는 입실 일시보다 늦어야 합니다.';
  return errors;
}

function zonedTimestamp(value: string): string {
  return `${value.length === 16 ? `${value}:00` : value}+09:00`;
}

export function importRowInput(values: ImportRowValues): CreateAdminStayInput {
  return {
    propertyId: values.propertyId.toLowerCase(),
    guestName: values.guestName.trim(),
    company: values.company.trim() || null,
    department: values.department.trim() || null,
    phone: values.phone.trim() || null,
    notes: values.notes.trim() || null,
    checkInAt: zonedTimestamp(values.checkInAt),
    checkOutAt: zonedTimestamp(values.checkOutAt),
  };
}

export function importRowStatus(row: StayImportRowDto): string {
  if (row.stayId) return '등록 완료';
  if (row.action === 'SKIP') return '제외';
  if (row.action === 'UPDATE') return '지원하지 않는 처리';
  return row.validationStatus === 'VALID'
    ? '등록 준비'
    : row.validationStatus === 'INVALID'
      ? '오류'
      : '확인 필요';
}
