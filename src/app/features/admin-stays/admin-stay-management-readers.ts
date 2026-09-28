import type {
  AdminStayRevisionDto,
  AdminStaySnapshot,
} from './admin-stay-management.types';
import {
  invalidStayResponse,
  isNullableText,
  isRecord,
  isText,
  isTimestamp,
  readStayFields,
} from './admin-stays-readers';
import { isStayId } from './admin-stays-validation';

export function readStayPage<T>(
  value: unknown,
  page: number,
  limit: number,
  readItem: (item: unknown) => T,
) {
  if (
    !isRecord(value) ||
    !Array.isArray(value.items) ||
    value.page !== page ||
    value.limit !== limit ||
    typeof value.total !== 'number' ||
    !Number.isSafeInteger(value.total) ||
    value.total < 0 ||
    typeof value.totalPages !== 'number' ||
    value.totalPages !== Math.ceil(value.total / limit) ||
    value.totalPages > 100_000 ||
    value.items.length !==
      Math.max(0, Math.min(limit, value.total - (page - 1) * limit))
  )
    throw invalidStayResponse();
  return {
    items: value.items.map(readItem),
    total: value.total,
    page,
    limit,
    totalPages: value.totalPages,
  };
}

function readSnapshot(value: unknown, stayId: string): AdminStaySnapshot {
  if (!isRecord(value) || value.schemaVersion !== 1)
    throw invalidStayResponse();
  return { schemaVersion: 1, ...readStayFields(value, stayId) };
}

export function readStayRevision(
  value: unknown,
  stayId: string,
): AdminStayRevisionDto {
  if (
    !isRecord(value) ||
    !isStayId(value.id) ||
    !isStayId(value.stayId) ||
    value.stayId.toLowerCase() !== stayId ||
    typeof value.version !== 'number' ||
    !Number.isInteger(value.version) ||
    value.version < 1 ||
    value.version > 2_147_483_647 ||
    (value.action !== 'CREATED' &&
      value.action !== 'CORRECTED' &&
      value.action !== 'CANCELLED' &&
      value.action !== 'RESTORED') ||
    !isStayId(value.actorUserId) ||
    !isRecord(value.actorSnapshot) ||
    value.actorSnapshot.schemaVersion !== 1 ||
    !isStayId(value.actorSnapshot.id) ||
    value.actorSnapshot.id.toLowerCase() !== value.actorUserId.toLowerCase() ||
    !isText(value.actorSnapshot.name) ||
    (value.actorSnapshot.role !== 'ADMIN' &&
      value.actorSnapshot.role !== 'STAFF' &&
      value.actorSnapshot.role !== 'GUEST') ||
    !isNullableText(value.reason) ||
    (value.importRowId !== null && !isStayId(value.importRowId)) ||
    !isTimestamp(value.createdAt)
  )
    throw invalidStayResponse();
  const snapshot = readSnapshot(value.snapshot, stayId);
  if (
    snapshot.currentRevision !== value.version ||
    (value.action === 'CREATED') !== (value.version === 1) ||
    (value.action === 'CANCELLED'
      ? snapshot.status !== 'CANCELLED' ||
        !isText(value.reason) ||
        value.reason !== snapshot.cancellationReason
      : snapshot.status !== 'ACTIVE') ||
    (value.action === 'RESTORED' && !isText(value.reason)) ||
    (value.action === 'CREATED' &&
      (value.reason !== null ||
        snapshot.createdByUserId !== value.actorUserId.toLowerCase())) ||
    (value.importRowId !== null &&
      (value.action !== 'CREATED' || snapshot.source !== 'EXCEL')) ||
    (value.action === 'CREATED' &&
      snapshot.source === 'EXCEL' &&
      value.importRowId === null)
  )
    throw invalidStayResponse();
  return {
    id: value.id.toLowerCase(),
    stayId,
    version: value.version,
    action: value.action,
    snapshot,
    actorUserId: value.actorUserId.toLowerCase(),
    actorSnapshot: {
      schemaVersion: 1,
      id: value.actorSnapshot.id.toLowerCase(),
      name: value.actorSnapshot.name,
      role: value.actorSnapshot.role,
    },
    reason: value.reason,
    importRowId: value.importRowId?.toLowerCase() ?? null,
    createdAt: value.createdAt,
  };
}
