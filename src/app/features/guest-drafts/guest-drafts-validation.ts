import { ApiRequestError } from '../../core/api/api-error';
import { getSeoulToday } from '../../core/dates/seoul-date';
import type { GuestEntryContext } from '../guest-entry/guest-entry.types';
import {
  isGuestAccessToken,
  isGuestId,
  isGuestText,
} from '../guest-entry/guest-entry-validation';
import type { GuestDraftType, StartGuestDraftInput } from './guest-drafts.types';

export function invalidGuestDraftResponse(): ApiRequestError {
  return new ApiRequestError(
    '작성 내용의 응답을 확인할 수 없습니다. 현재 저장 상태를 다시 확인해 주세요.',
    200,
    'INVALID_GUEST_DRAFT_RESPONSE',
  );
}

export function invalidGuestDraftInput(message: string): ApiRequestError {
  return new ApiRequestError(message, 400, 'INVALID_GUEST_DRAFT_INPUT');
}

export function requireDraftToken(token: unknown): asserts token is string {
  if (!isGuestAccessToken(token))
    throw invalidGuestDraftInput('작성 링크 형식을 확인해 주세요.');
}

export function isGuestDraftType(value: unknown): value is GuestDraftType {
  return value === 'CHECK_IN' || value === 'CHECK_OUT';
}

export function isGuestDraftDate(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    value < '1900-01-01' ||
    value > '2100-12-31'
  )
    return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function normalizeDraftText(
  value: unknown,
  maximum: number,
  label: string,
): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string')
    throw invalidGuestDraftInput(`${label}을 확인해 주세요.`);
  const text = value.trim();
  if ([...text].length > maximum)
    throw invalidGuestDraftInput(`${label}은 ${maximum}자 이하로 입력해 주세요.`);
  return text || null;
}

export interface PreparedGuestStart {
  requestKey: string;
  type: GuestDraftType;
  visitDate?: string;
  guestName?: string;
  company?: string | null;
  department?: string | null;
  phone?: string | null;
}

export function prepareGuestDraftStart(
  entry: GuestEntryContext,
  input: StartGuestDraftInput,
): PreparedGuestStart {
  if (
    !input ||
    !isGuestId(input.requestKey) ||
    !isGuestDraftType(input.type) ||
    !entry ||
    (entry.kind !== 'qr' && entry.kind !== 'stay') ||
    !isGuestId(entry.context?.property?.id) ||
    Object.keys(input).some(
      (key) => !['requestKey', 'type', 'visitDate', 'guestName', 'company', 'department', 'phone'].includes(key),
    )
  )
    throw invalidGuestDraftInput('체크리스트 작성 정보를 확인해 주세요.');
  const common = { requestKey: input.requestKey.toLowerCase(), type: input.type };
  if (entry.kind === 'stay') {
    if (
      ['visitDate', 'guestName', 'company', 'department', 'phone'].some(
        (field) => input[field as keyof StartGuestDraftInput] !== undefined,
      )
    )
      throw invalidGuestDraftInput('개인 이용 링크의 이용객 정보는 변경할 수 없습니다.');
    return common;
  }
  const name = typeof input.guestName === 'string' ? input.guestName.trim() : '';
  if (!isGuestText(name, 100))
    throw invalidGuestDraftInput('이용객 이름을 100자 이하로 입력해 주세요.');
  if (!isGuestDraftDate(input.visitDate))
    throw invalidGuestDraftInput('이용일을 1900~2100년의 올바른 날짜로 선택해 주세요.');
  return {
    ...common,
    guestName: name,
    visitDate: input.visitDate,
    company: normalizeDraftText(input.company, 150, '회사명'),
    department: normalizeDraftText(input.department, 150, '부서명'),
    phone: normalizeDraftText(input.phone, 50, '연락처'),
  };
}

export function guestStartVisitDate(
  entry: GuestEntryContext,
  input: PreparedGuestStart,
): string {
  if (entry.kind === 'qr') return input.visitDate!;
  return getSeoulToday(
    new Date(input.type === 'CHECK_IN' ? entry.context.checkInAt : entry.context.checkOutAt),
  );
}
