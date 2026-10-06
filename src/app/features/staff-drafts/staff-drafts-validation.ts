import { ApiRequestError } from '../../core/api/api-error';
import { readStaffQrContext } from '../staff-entry/staff-entry-readers';
import type { StaffQrContextDto } from '../staff-entry/staff-entry.types';
import { isStaffEntryId } from '../staff-entry/staff-entry-validation';
import type { StartStaffDraftInput } from './staff-drafts.types';

export function invalidStaffDraftResponse(): ApiRequestError {
  return new ApiRequestError(
    '작성 내용의 응답을 확인할 수 없습니다. 현재 저장 상태를 다시 확인해 주세요.',
    200,
    'INVALID_STAFF_DRAFT_RESPONSE',
  );
}

export function invalidStaffDraftInput(message: string): ApiRequestError {
  return new ApiRequestError(message, 400, 'INVALID_STAFF_DRAFT_INPUT');
}

export function isStaffDraftToken(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length === 43 &&
    /^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/.test(value)
  );
}

export function requireStaffDraftToken(
  value: unknown,
): asserts value is string {
  if (!isStaffDraftToken(value))
    throw invalidStaffDraftInput('작성 링크 형식을 확인해 주세요.');
}

export function isStaffDraftTimestamp(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
  )
    return false;
  const timestamp = Date.parse(value);
  return (
    Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value
  );
}

export function isStaffDraftDate(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    value < '1900-01-01' ||
    value > '2100-12-31'
  )
    return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function staffDraftObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw invalidStaffDraftResponse();
  return value as Record<string, unknown>;
}

export function normalizeStaffDraftText(
  value: unknown,
  maximum: number,
): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string')
    throw invalidStaffDraftInput('메모 형식을 확인해 주세요.');
  const text = value.trim();
  if ([...text].length > maximum)
    throw invalidStaffDraftInput(`메모는 ${maximum}자 이하로 입력해 주세요.`);
  return text || null;
}

export function prepareStaffDraftStart(
  entry: StaffQrContextDto,
  input: StartStaffDraftInput,
): StartStaffDraftInput {
  try {
    const context = readStaffQrContext(entry);
    const value = staffDraftObject(input);
    if (
      !context.assignedStaff ||
      context.checklists.length !== 1 ||
      !isStaffEntryId(value.requestKey) ||
      !isStaffEntryId(value.confirmedStaffId) ||
      value.confirmedStaffId.toLowerCase() !== context.assignedStaff.id ||
      Object.keys(value).some(
        (key) => !['requestKey', 'confirmedStaffId'].includes(key),
      )
    )
      throw invalidStaffDraftInput(
        '현재 담당자와 정비 체크리스트를 다시 확인해 주세요.',
      );
    return {
      requestKey: value.requestKey.toLowerCase(),
      confirmedStaffId: value.confirmedStaffId.toLowerCase(),
    };
  } catch {
    throw invalidStaffDraftInput(
      '현재 담당자와 정비 체크리스트를 다시 확인해 주세요.',
    );
  }
}
