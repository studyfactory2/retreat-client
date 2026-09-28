import { isStayId } from '../admin-stays/admin-stays-validation';
import type {
  StayImportNormalizedData,
  StayImportRawCell,
  StayImportRowDto,
  StayImportValidationMessage,
} from './admin-stay-imports.types';
import {
  invalidImportResponse,
  isDate,
  isImportAction,
  isInteger,
  isNullableText,
  isRecord,
  isText,
  isTimestamp,
  isValidationStatus,
} from './admin-stay-imports-validation';

function readReview(value: unknown): StayImportNormalizedData['review'] {
  if (value === undefined) return undefined;
  if (
    !isRecord(value) ||
    !isRecord(value.actor) ||
    !isStayId(value.actor.id) ||
    !isText(value.actor.name) ||
    (value.actor.role !== 'ADMIN' &&
      value.actor.role !== 'STAFF' &&
      value.actor.role !== 'GUEST') ||
    !isTimestamp(value.at) ||
    (value.action !== 'CREATE' && value.action !== 'SKIP')
  )
    throw invalidImportResponse();
  return {
    actor: {
      id: value.actor.id.toLowerCase(),
      name: value.actor.name,
      role: value.actor.role,
    },
    at: value.at,
    action: value.action,
  };
}

function readNormalized(value: unknown): StayImportNormalizedData | null {
  if (value === null) return null;
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    value.guestCount !== null ||
    !isNullableText(value.guestName) ||
    !isNullableText(value.company) ||
    !isNullableText(value.department) ||
    !isNullableText(value.phone) ||
    !isNullableText(value.notes) ||
    (value.checkInDate !== null && !isDate(value.checkInDate)) ||
    (value.checkOutDate !== null && !isDate(value.checkOutDate)) ||
    (value.checkInAt !== null && !isTimestamp(value.checkInAt)) ||
    (value.checkOutAt !== null && !isTimestamp(value.checkOutAt))
  )
    throw invalidImportResponse();
  // Source rows may exceed stay-field limits or have missing/reversed dates.
  // Those are reviewable data, not a malformed transport response.
  const review = readReview(value.review);
  return {
    schemaVersion: 1,
    guestName: value.guestName,
    company: value.company,
    department: value.department,
    phone: value.phone,
    guestCount: null,
    checkInDate: value.checkInDate,
    checkOutDate: value.checkOutDate,
    checkInAt: value.checkInAt,
    checkOutAt: value.checkOutAt,
    notes: value.notes,
    ...(review === undefined ? {} : { review }),
  };
}

function readMessages(value: unknown): StayImportValidationMessage[] {
  if (!Array.isArray(value)) throw invalidImportResponse();
  return value.map((entry) => {
    if (
      !isRecord(entry) ||
      !isText(entry.code) ||
      !isText(entry.message) ||
      (entry.stayIds !== undefined &&
        (!Array.isArray(entry.stayIds) ||
          entry.stayIds.length > 20 ||
          !entry.stayIds.every(isStayId)))
    )
      throw invalidImportResponse();
    return {
      code: entry.code,
      message: entry.message,
      ...(entry.stayIds === undefined
        ? {}
        : {
            stayIds: (entry.stayIds as string[]).map((id) => id.toLowerCase()),
          }),
    };
  });
}

function readCell(value: unknown, index: number): StayImportRawCell {
  if (
    !isRecord(value) ||
    value.column !== String.fromCharCode(65 + index) ||
    !(
      value.value === null ||
      typeof value.value === 'string' ||
      typeof value.value === 'boolean' ||
      (typeof value.value === 'number' && Number.isFinite(value.value))
    ) ||
    (typeof value.value === 'string' && value.value.length > 4000) ||
    !isText(value.type) ||
    !isNullableText(value.format) ||
    typeof value.formula !== 'boolean'
  )
    throw invalidImportResponse();
  return {
    column: value.column,
    value: value.value,
    type: value.type,
    format: value.format,
    formula: value.formula,
  };
}

function isReadyData(value: StayImportNormalizedData | null): boolean {
  return (
    value !== null &&
    isText(value.guestName) &&
    [...value.guestName].length <= 100 &&
    isTimestamp(value.checkInAt) &&
    isTimestamp(value.checkOutAt) &&
    Date.parse(value.checkInAt) < Date.parse(value.checkOutAt) &&
    (value.company === null || [...value.company].length <= 100) &&
    (value.department === null || [...value.department].length <= 100) &&
    (value.phone === null || [...value.phone].length <= 32) &&
    (value.notes === null || [...value.notes].length <= 2000)
  );
}

export function readImportRow(value: unknown): StayImportRowDto {
  if (
    !isRecord(value) ||
    !isStayId(value.id) ||
    !isText(value.sheetName) ||
    !isInteger(value.rowNumber, 2, 2000) ||
    (value.propertyId !== null && !isStayId(value.propertyId)) ||
    (value.stayId !== null && !isStayId(value.stayId)) ||
    (value.appliedAt !== null && !isTimestamp(value.appliedAt)) ||
    (value.stayId === null) !== (value.appliedAt === null) ||
    !isImportAction(value.action) ||
    !isValidationStatus(value.validationStatus) ||
    !isRecord(value.rawData) ||
    value.rawData.schemaVersion !== 1 ||
    !Array.isArray(value.rawData.cells) ||
    value.rawData.cells.length !== 12
  )
    throw invalidImportResponse();
  const normalizedData = readNormalized(value.normalizedData);
  const validationMessages = readMessages(value.validationMessages);
  if (
    (value.action === 'CREATE' && normalizedData === null) ||
    (value.action === 'SKIP' && value.stayId !== null) ||
    (value.action === 'CREATE' &&
      value.validationStatus === 'VALID' &&
      (value.propertyId === null ||
        !isReadyData(normalizedData) ||
        validationMessages.length !== 0))
  )
    throw invalidImportResponse();
  return {
    id: value.id.toLowerCase(),
    sheetName: value.sheetName,
    rowNumber: value.rowNumber,
    propertyId: value.propertyId?.toLowerCase() ?? null,
    stayId: value.stayId?.toLowerCase() ?? null,
    appliedAt: value.appliedAt,
    action: value.action,
    validationStatus: value.validationStatus,
    normalizedData,
    validationMessages,
    rawData: { schemaVersion: 1, cells: value.rawData.cells.map(readCell) },
  };
}
