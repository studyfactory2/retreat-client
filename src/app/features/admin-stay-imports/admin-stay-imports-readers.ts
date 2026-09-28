import { isStayId } from '../admin-stays/admin-stays-validation';
import type {
  GetStayImportInput,
  StayImportConfirmationDto,
  StayImportPreviewDto,
} from './admin-stay-imports.types';
import { readImportRow } from './admin-stay-imports-row-readers';
import {
  invalidImportResponse,
  isInteger,
  isRecord,
  isText,
  isTimestamp,
  STAY_IMPORT_MAX_FILE_BYTES,
  STAY_IMPORT_PAGE_SIZE,
} from './admin-stay-imports-validation';

function readBatch(
  value: unknown,
  expectedId?: string,
): StayImportPreviewDto['batch'] {
  if (
    !isRecord(value) ||
    !isStayId(value.id) ||
    (expectedId !== undefined && value.id.toLowerCase() !== expectedId) ||
    (value.status !== 'PREVIEW' &&
      value.status !== 'CONFIRMED' &&
      value.status !== 'CANCELLED' &&
      value.status !== 'FAILED') ||
    !isInteger(value.version, 1, 2_147_483_647) ||
    value.parserVersion !== 'retreat-roster-v1' ||
    value.timezone !== 'Asia/Seoul' ||
    !isTimestamp(value.createdAt) ||
    (value.confirmedAt !== null && !isTimestamp(value.confirmedAt)) ||
    (value.confirmedByUserId !== null && !isStayId(value.confirmedByUserId)) ||
    !isRecord(value.source) ||
    !isText(value.source.filename) ||
    !/\.xls$/i.test(value.source.filename) ||
    value.source.filename.length > 255 ||
    !isInteger(value.source.sizeBytes, 1, STAY_IMPORT_MAX_FILE_BYTES) ||
    !isRecord(value.summary) ||
    !isInteger(value.summary.total, 1, 5000) ||
    !isInteger(value.summary.ready, 0, 5000) ||
    !isInteger(value.summary.needsReview, 0, 5000) ||
    !isInteger(value.summary.invalid, 0, 5000) ||
    !isInteger(value.summary.skipped, 0, 5000) ||
    value.summary.total !==
      value.summary.ready +
        value.summary.needsReview +
        value.summary.invalid +
        value.summary.skipped
  )
    throw invalidImportResponse();
  if (
    value.status === 'CONFIRMED'
      ? value.version < 2 ||
        value.confirmedAt === null ||
        value.confirmedByUserId === null ||
        value.summary.needsReview !== 0 ||
        value.summary.invalid !== 0
      : value.confirmedAt !== null || value.confirmedByUserId !== null
  )
    throw invalidImportResponse();
  return {
    id: value.id.toLowerCase(),
    status: value.status,
    version: value.version,
    parserVersion: 'retreat-roster-v1',
    timezone: 'Asia/Seoul',
    createdAt: value.createdAt,
    confirmedAt: value.confirmedAt,
    confirmedByUserId: value.confirmedByUserId?.toLowerCase() ?? null,
    source: {
      filename: value.source.filename,
      sizeBytes: value.source.sizeBytes,
    },
    summary: {
      total: value.summary.total,
      ready: value.summary.ready,
      needsReview: value.summary.needsReview,
      invalid: value.summary.invalid,
      skipped: value.summary.skipped,
    },
  };
}

export function readImportPreview(
  value: unknown,
  input: GetStayImportInput,
  expectedId?: string,
): StayImportPreviewDto {
  if (!isRecord(value)) throw invalidImportResponse();
  const batch = readBatch(value.batch, expectedId);
  const rows = value.rows;
  if (
    !isRecord(rows) ||
    !Array.isArray(rows.items) ||
    rows.page !== input.page ||
    rows.limit !== STAY_IMPORT_PAGE_SIZE ||
    !isInteger(rows.total, 0, batch.summary.total) ||
    rows.totalPages !== Math.ceil(rows.total / STAY_IMPORT_PAGE_SIZE) ||
    rows.items.length !==
      Math.max(
        0,
        Math.min(
          STAY_IMPORT_PAGE_SIZE,
          rows.total - (input.page - 1) * STAY_IMPORT_PAGE_SIZE,
        ),
      ) ||
    (input.action === undefined &&
      input.validationStatus === undefined &&
      rows.total !== batch.summary.total)
  )
    throw invalidImportResponse();
  const items = rows.items.map(readImportRow);
  const counts = { ready: 0, needsReview: 0, invalid: 0, skipped: 0 };
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (
      (input.action !== undefined && item.action !== input.action) ||
      (input.validationStatus !== undefined &&
        item.validationStatus !== input.validationStatus) ||
      (batch.status === 'PREVIEW' && item.stayId !== null) ||
      (batch.status === 'CONFIRMED' &&
        item.action !== 'SKIP' &&
        (item.action !== 'CREATE' ||
          item.validationStatus !== 'VALID' ||
          item.stayId === null)) ||
      (index > 0 &&
        items[index - 1].sheetName === item.sheetName &&
        items[index - 1].rowNumber >= item.rowNumber)
    )
      throw invalidImportResponse();
    if (item.action === 'SKIP') counts.skipped += 1;
    else if (item.validationStatus === 'INVALID') counts.invalid += 1;
    else if (item.validationStatus === 'NEEDS_REVIEW') counts.needsReview += 1;
    else counts.ready += 1;
  }
  if (
    new Set(items.map((row) => row.id)).size !== items.length ||
    new Set(items.map((row) => JSON.stringify([row.sheetName, row.rowNumber])))
      .size !== items.length ||
    (Object.keys(counts) as Array<keyof typeof counts>).some(
      (key) => counts[key] > batch.summary[key],
    )
  )
    throw invalidImportResponse();
  return {
    batch,
    rows: {
      items,
      total: rows.total,
      page: input.page,
      limit: STAY_IMPORT_PAGE_SIZE,
      totalPages: Math.ceil(rows.total / STAY_IMPORT_PAGE_SIZE),
    },
  };
}

export function readImportConfirmation(
  value: unknown,
  expectedId: string,
  expectedVersion: number,
): StayImportConfirmationDto {
  if (
    !isRecord(value) ||
    !isStayId(value.batchId) ||
    value.batchId.toLowerCase() !== expectedId ||
    value.status !== 'CONFIRMED' ||
    value.version !== expectedVersion + 1 ||
    !isTimestamp(value.confirmedAt) ||
    !isStayId(value.confirmedByUserId) ||
    !isInteger(value.createdCount, 0, 5000) ||
    !isInteger(value.skippedCount, 0, 5000) ||
    value.createdCount + value.skippedCount < 1 ||
    value.createdCount + value.skippedCount > 5000
  )
    throw invalidImportResponse();
  return {
    batchId: expectedId,
    status: 'CONFIRMED',
    version: value.version,
    confirmedAt: value.confirmedAt,
    confirmedByUserId: value.confirmedByUserId.toLowerCase(),
    createdCount: value.createdCount,
    skippedCount: value.skippedCount,
  };
}
