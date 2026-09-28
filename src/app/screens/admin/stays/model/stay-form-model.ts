import { ApiRequestError } from '../../../../core/api/api-error';
import type {
  AdminStayDto,
  CreateAdminStayInput,
  UpdateAdminStayInput,
} from '../../../../features/admin-stays/admin-stays.types';
import {
  isStayId,
  isStayRevision,
} from '../../../../features/admin-stays/admin-stays-validation';

export interface StayFormValues {
  propertyId: string;
  guestName: string;
  company: string;
  department: string;
  phone: string;
  checkInAt: string;
  checkOutAt: string;
  notes: string;
  reason: string;
}

export type StayFormErrors = Partial<Record<keyof StayFormValues, string>>;

const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1_000;
const DAY_MS = 24 * 60 * 60 * 1_000;
const OPTIONAL_TEXT_LIMITS = {
  company: 100,
  department: 100,
  phone: 32,
  notes: 2_000,
  reason: 1_000,
} as const;
const FIELD_LABELS = {
  company: '회사명',
  department: '부서명',
  phone: '연락처',
  notes: '메모',
  reason: '수정 사유',
} as const;

function nullableText(value: string): string | null {
  return value.trim() || null;
}

function localMinute(timestamp: string): string {
  return new Date(Date.parse(timestamp) + SEOUL_OFFSET_MS)
    .toISOString()
    .slice(0, 16);
}

function validMinute(value: string): boolean {
  if (!/^[1-9]\d{3}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(value))
    return false;
  const time = Date.parse(`${value}:00.000Z`);
  return (
    Number.isFinite(time) && new Date(time).toISOString().slice(0, 16) === value
  );
}

function inCalendarRange(value: string): boolean {
  return value >= '1900-01-01T00:00' && value <= '2100-12-31T23:59';
}

function effectiveTimestamp(value: string, original?: string): string {
  return original !== undefined && value === localMinute(original)
    ? original
    : `${value}:00+09:00`;
}

export function createStayFormValues(
  date: string,
  propertyId?: string,
): StayFormValues {
  const start = `${date}T15:00`;
  const endDate = validMinute(start)
    ? new Date(Date.parse(`${date}T00:00:00.000Z`) + DAY_MS)
        .toISOString()
        .slice(0, 10)
    : '';
  const end = `${endDate}T11:00`;
  return {
    propertyId: propertyId?.toLowerCase() ?? '',
    guestName: '',
    company: '',
    department: '',
    phone: '',
    // Editable suggestions, not a property-specific arrival/departure policy.
    checkInAt: validMinute(start) && inCalendarRange(start) ? start : '',
    checkOutAt: validMinute(end) && inCalendarRange(end) ? end : '',
    notes: '',
    reason: '',
  };
}

export function stayToFormValues(stay: AdminStayDto): StayFormValues {
  return {
    propertyId: stay.propertyId,
    guestName: stay.guestName,
    company: stay.company ?? '',
    department: stay.department ?? '',
    phone: stay.phone ?? '',
    checkInAt: localMinute(stay.checkInAt),
    checkOutAt: localMinute(stay.checkOutAt),
    notes: stay.notes ?? '',
    reason: '',
  };
}

export function validateStayForm(
  values: StayFormValues,
  original?: AdminStayDto,
): StayFormErrors {
  const errors: StayFormErrors = {};
  if (!isStayId(values.propertyId))
    errors.propertyId = '휴양소를 선택해 주세요.';
  if (!values.guestName.trim())
    errors.guestName = '이용객 이름을 입력해 주세요.';
  else if ([...values.guestName.trim()].length > 100)
    errors.guestName = '이용객 이름은 100자 이하여야 합니다.';
  for (const field of Object.keys(OPTIONAL_TEXT_LIMITS) as Array<
    keyof typeof OPTIONAL_TEXT_LIMITS
  >) {
    if ([...values[field].trim()].length > OPTIONAL_TEXT_LIMITS[field])
      errors[field] =
        `${FIELD_LABELS[field]}은(는) ${OPTIONAL_TEXT_LIMITS[field].toLocaleString('ko-KR')}자 이하여야 합니다.`;
  }
  for (const field of ['checkInAt', 'checkOutAt'] as const) {
    // Older backend records may fall outside the calendar's supported years.
    // Leaving the field untouched must still allow a guest or notes correction.
    if (original && values[field] === localMinute(original[field])) continue;
    if (!validMinute(values[field]) || !inCalendarRange(values[field]))
      errors[field] = '1900~2100년의 올바른 날짜와 시간을 입력해 주세요.';
  }
  if (!errors.checkInAt && !errors.checkOutAt) {
    const start = effectiveTimestamp(values.checkInAt, original?.checkInAt);
    const end = effectiveTimestamp(values.checkOutAt, original?.checkOutAt);
    if (Date.parse(end) <= Date.parse(start))
      errors.checkOutAt = '퇴실 일시는 입실 일시보다 늦어야 합니다.';
  }
  if (original) {
    if (values.propertyId.toLowerCase() !== original.propertyId.toLowerCase())
      errors.propertyId = '등록된 일정의 휴양소는 변경할 수 없습니다.';
    if (original.status !== 'ACTIVE')
      errors.reason = '취소된 이용 일정은 수정할 수 없습니다.';
    if (!isStayRevision(original.currentRevision))
      errors.reason =
        '이 기록은 더 이상 수정할 수 없습니다. 관리자에게 확인해 주세요.';
    if (!original.property.isActive) {
      for (const field of ['checkInAt', 'checkOutAt'] as const) {
        if (values[field] !== localMinute(original[field]))
          errors[field] = '비활성 휴양소의 이용 일시는 변경할 수 없습니다.';
      }
    }
  }
  return errors;
}

function requireValid(values: StayFormValues, original?: AdminStayDto) {
  const errors = validateStayForm(values, original);
  if (Object.keys(errors).length)
    throw new ApiRequestError(
      '입력 내용을 확인해 주세요.',
      400,
      'VALIDATION_ERROR',
      Object.entries(errors).map(([field, message]) => ({
        field,
        messages: [message],
      })),
    );
}

export function buildCreateStayInput(
  values: StayFormValues,
): CreateAdminStayInput {
  requireValid(values);
  return {
    propertyId: values.propertyId.toLowerCase(),
    guestName: values.guestName.trim(),
    company: nullableText(values.company),
    department: nullableText(values.department),
    phone: nullableText(values.phone),
    notes: nullableText(values.notes),
    checkInAt: effectiveTimestamp(values.checkInAt),
    checkOutAt: effectiveTimestamp(values.checkOutAt),
  };
}

export function buildUpdateStayInput(
  values: StayFormValues,
  original: AdminStayDto,
): UpdateAdminStayInput | null {
  requireValid(values, original);
  const changes: Omit<UpdateAdminStayInput, 'expectedRevision' | 'reason'> = {};
  if (values.guestName.trim() !== original.guestName.trim())
    changes.guestName = values.guestName.trim();
  for (const field of ['company', 'department', 'phone', 'notes'] as const) {
    const next = nullableText(values[field]);
    if (next !== nullableText(original[field] ?? '')) changes[field] = next;
  }
  for (const field of ['checkInAt', 'checkOutAt'] as const) {
    if (values[field] !== localMinute(original[field]))
      changes[field] = effectiveTimestamp(values[field]);
  }
  if (Object.keys(changes).length === 0) return null;
  return {
    expectedRevision: original.currentRevision,
    ...changes,
    ...(nullableText(values.reason) ? { reason: values.reason.trim() } : {}),
  };
}
