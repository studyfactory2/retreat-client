import { ApiRequestError } from '../../core/api/api-error';
import { isStayId } from '../admin-stays/admin-stays-validation';
import type {
  StayImportRowAction,
  StayImportValidationStatus,
} from './admin-stay-imports.types';

export const STAY_IMPORT_PAGE_SIZE = 20;
export const STAY_IMPORT_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const STAY_IMPORT_MANAGED_SHEETS = [
  '부산휴양소(해운대)',
  '부산휴양소(기장)',
  '경주휴양소',
  '애월1호점',
  '애월2호점',
  '가평휴양소',
] as const;

export function invalidImportResponse(): ApiRequestError {
  return new ApiRequestError(
    '명단 응답을 확인할 수 없습니다. 최신 미리보기를 다시 확인해 주세요.',
    200,
    'INVALID_STAY_IMPORT_RESPONSE',
  );
}

export function invalidImportInput(message: string): ApiRequestError {
  return new ApiRequestError(message, 400, 'INVALID_STAY_IMPORT_INPUT');
}

export function requireImportId(value: string): string {
  if (!isStayId(value))
    throw invalidImportInput('명단 또는 휴양소 정보를 확인해 주세요.');
  return value.toLowerCase();
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isNullableText(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

export function isInteger(
  value: unknown,
  min: number,
  max: number,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= min &&
    value <= max
  );
}

export function isTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value;
}

export function isDate(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[1-9]\d{3}-\d{2}-\d{2}$/.test(value) &&
    isTimestamp(`${value}T00:00:00.000Z`)
  );
}

export function isImportAction(value: unknown): value is StayImportRowAction {
  return value === 'CREATE' || value === 'UPDATE' || value === 'SKIP';
}

export function isValidationStatus(
  value: unknown,
): value is StayImportValidationStatus {
  return value === 'VALID' || value === 'NEEDS_REVIEW' || value === 'INVALID';
}

export function requireImportVersion(value: number) {
  if (!isInteger(value, 1, 2_147_483_646))
    throw invalidImportInput('최신 명단을 불러온 뒤 다시 진행해 주세요.');
}
