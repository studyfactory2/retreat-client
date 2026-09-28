import { apiRequest } from '../../core/api/api-client';
import type { CreateAdminStayInput } from '../admin-stays/admin-stays.types';
import type {
  ConfirmStayImportInput,
  GetStayImportInput,
  ReviewStayImportInput,
  StayImportConfirmationDto,
  StayImportPreviewDto,
  StayImportPropertyMapping,
} from './admin-stay-imports.types';
import {
  readImportConfirmation,
  readImportPreview,
} from './admin-stay-imports-readers';
import {
  invalidImportInput,
  invalidImportResponse,
  isImportAction,
  isInteger,
  isNullableText,
  isRecord,
  isText,
  isValidationStatus,
  requireImportId,
  requireImportVersion,
  STAY_IMPORT_MANAGED_SHEETS,
  STAY_IMPORT_MAX_FILE_BYTES,
  STAY_IMPORT_PAGE_SIZE,
} from './admin-stay-imports-validation';

export {
  STAY_IMPORT_MANAGED_SHEETS,
  STAY_IMPORT_MAX_FILE_BYTES,
  STAY_IMPORT_PAGE_SIZE,
} from './admin-stay-imports-validation';

const IMPORT_MUTATION_TIMEOUT_MS = 90_000;

function requireFilters(input: GetStayImportInput) {
  if (
    !isInteger(input.page, 1, 100_000) ||
    (input.action !== undefined && !isImportAction(input.action)) ||
    (input.validationStatus !== undefined &&
      !isValidationStatus(input.validationStatus))
  )
    throw invalidImportInput('명단 조회 조건을 확인해 주세요.');
}

export async function previewStayImport(
  file: File,
  mappings: StayImportPropertyMapping[],
  token: string,
  signal?: AbortSignal,
): Promise<StayImportPreviewDto> {
  if (
    !(file instanceof File) ||
    !/\.xls$/i.test(file.name) ||
    !isInteger(file.size, 1, STAY_IMPORT_MAX_FILE_BYTES)
  )
    throw invalidImportInput(
      '5MB 이하의 .xls 이용자 명단 파일을 선택해 주세요.',
    );
  if (!Array.isArray(mappings) || mappings.length > 40)
    throw invalidImportInput('시트 연결 정보는 40개까지 입력할 수 있습니다.');
  const cleanMappings = mappings.map((mapping) => {
    if (
      !isRecord(mapping) ||
      !isText(mapping.sheetName) ||
      [...mapping.sheetName].length > 31 ||
      !STAY_IMPORT_MANAGED_SHEETS.some(
        (name) =>
          name === mapping.sheetName.normalize('NFC').replace(/\s/g, ''),
      )
    )
      throw invalidImportInput('관리 대상 시트의 정확한 이름을 입력해 주세요.');
    return {
      sheetName: mapping.sheetName,
      propertyId: requireImportId(mapping.propertyId),
    };
  });
  if (
    new Set(cleanMappings.map((mapping) => mapping.sheetName)).size !==
      cleanMappings.length ||
    new Set(cleanMappings.map((mapping) => mapping.propertyId)).size !==
      cleanMappings.length
  )
    throw invalidImportInput(
      '같은 시트나 휴양소를 중복으로 연결할 수 없습니다.',
    );
  const body = new FormData();
  body.append('file', file);
  if (cleanMappings.length)
    body.append('propertyMappings', JSON.stringify(cleanMappings));
  const value = await apiRequest<unknown>('/admin/stay-imports/preview', {
    method: 'POST',
    body,
    token,
    signal,
    timeoutMs: IMPORT_MUTATION_TIMEOUT_MS,
  });
  const result = readImportPreview(value, { page: 1 });
  if (result.batch.status !== 'PREVIEW' || result.batch.version !== 1)
    throw invalidImportResponse();
  return result;
}

export async function getStayImport(
  id: string,
  input: GetStayImportInput,
  token: string,
  signal?: AbortSignal,
): Promise<StayImportPreviewDto> {
  const batchId = requireImportId(id);
  requireFilters(input);
  const query = new URLSearchParams({
    page: String(input.page),
    limit: String(STAY_IMPORT_PAGE_SIZE),
  });
  if (input.action !== undefined) query.set('action', input.action);
  if (input.validationStatus !== undefined)
    query.set('validationStatus', input.validationStatus);
  const value = await apiRequest<unknown>(
    `/admin/stay-imports/${batchId}?${query}`,
    { token, signal },
  );
  return readImportPreview(value, input, batchId);
}

function writeStayData(data: CreateAdminStayInput) {
  if (
    !isRecord(data) ||
    !isText(data.guestName) ||
    typeof data.checkInAt !== 'string' ||
    typeof data.checkOutAt !== 'string' ||
    ['company', 'department', 'phone', 'notes'].some(
      (field) => data[field] !== undefined && !isNullableText(data[field]),
    )
  )
    throw invalidImportInput(
      '등록할 이용객 정보와 입퇴실 일시를 확인해 주세요.',
    );
  return {
    propertyId: requireImportId(data.propertyId),
    guestName: data.guestName,
    checkInAt: data.checkInAt,
    checkOutAt: data.checkOutAt,
    ...(data.company === undefined ? {} : { company: data.company }),
    ...(data.department === undefined ? {} : { department: data.department }),
    ...(data.phone === undefined ? {} : { phone: data.phone }),
    ...(data.notes === undefined ? {} : { notes: data.notes }),
  };
}

type ReviewPayloadRow =
  | { id: string; action: 'SKIP' }
  | { id: string; action: 'CREATE'; data: ReturnType<typeof writeStayData> };

export async function reviewStayImport(
  id: string,
  input: ReviewStayImportInput,
  token: string,
  signal?: AbortSignal,
): Promise<StayImportPreviewDto> {
  const batchId = requireImportId(id);
  requireImportVersion(input.expectedVersion);
  if (
    !Array.isArray(input.rows) ||
    input.rows.length < 1 ||
    input.rows.length > 100
  )
    throw invalidImportInput(
      '검토할 명단 행을 1개 이상 100개 이하로 선택해 주세요.',
    );
  const rows = input.rows.map((row): ReviewPayloadRow => {
    if (!isRecord(row) || (row.action !== 'CREATE' && row.action !== 'SKIP'))
      throw invalidImportInput('명단 행의 처리 방법을 확인해 주세요.');
    const rowId = requireImportId(row.id);
    if (row.action === 'SKIP') return { id: rowId, action: 'SKIP' };
    return { id: rowId, action: 'CREATE', data: writeStayData(row.data) };
  });
  if (new Set(rows.map((row) => row.id)).size !== rows.length)
    throw invalidImportInput('같은 명단 행을 중복으로 수정할 수 없습니다.');
  const value = await apiRequest<unknown>(
    `/admin/stay-imports/${batchId}/review`,
    {
      method: 'POST',
      body: { expectedVersion: input.expectedVersion, rows },
      token,
      signal,
      timeoutMs: IMPORT_MUTATION_TIMEOUT_MS,
    },
  );
  const result = readImportPreview(value, { page: 1 }, batchId);
  // The backend reads the preview after the review transaction; another admin
  // may have advanced its version again before this response is assembled.
  if (result.batch.version <= input.expectedVersion)
    throw invalidImportResponse();
  return result;
}

export async function confirmStayImport(
  id: string,
  input: ConfirmStayImportInput,
  token: string,
  signal?: AbortSignal,
): Promise<StayImportConfirmationDto> {
  const batchId = requireImportId(id);
  requireImportVersion(input.expectedVersion);
  const value = await apiRequest<unknown>(
    `/admin/stay-imports/${batchId}/confirm`,
    {
      method: 'POST',
      body: { expectedVersion: input.expectedVersion },
      token,
      signal,
      timeoutMs: IMPORT_MUTATION_TIMEOUT_MS,
    },
  );
  return readImportConfirmation(value, batchId, input.expectedVersion);
}
