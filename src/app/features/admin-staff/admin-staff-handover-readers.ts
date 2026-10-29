import { ApiRequestError } from '../../core/api/api-error';
import { readAdminStaff } from './admin-staff-readers';
import { isStaffId } from './admin-staff-validation';
import type {
  DeactivateStaffInput,
  StaffDeactivationAssignment,
  StaffDeactivationAudit,
  StaffDeactivationPreview,
  StaffDeactivationResult,
} from './admin-staff-handover.types';

const STATE_TOKEN = /^[0-9a-f]{64}$/;
const MAX_ASSIGNMENTS = 1000;

export function invalidHandoverResponse(): ApiRequestError {
  return new ApiRequestError(
    '직원 인계 정보를 확인할 수 없습니다. 최신 상태를 다시 불러와 주세요.',
    200,
    'INVALID_STAFF_HANDOVER_RESPONSE',
  );
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw invalidHandoverResponse();
  return value as Record<string, unknown>;
}

function id(value: unknown): string {
  if (!isStaffId(value)) throw invalidHandoverResponse();
  return value.toLowerCase();
}

function text(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !value.trim() ||
    value.trim() !== value ||
    [...value].length > 100
  )
    throw invalidHandoverResponse();
  return value;
}

function nullableText(value: unknown): string | null {
  return value === null ? null : text(value);
}

function count(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)
    throw invalidHandoverResponse();
  return value;
}

function timestamp(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString() !== value
  )
    throw invalidHandoverResponse();
  return value;
}

function array(value: unknown): unknown[] {
  if (!Array.isArray(value) || value.length > MAX_ASSIGNMENTS)
    throw invalidHandoverResponse();
  return value;
}

function uniqueIds(values: unknown): string[] {
  const ids = array(values).map(id);
  if (new Set(ids).size !== ids.length) throw invalidHandoverResponse();
  return ids;
}

function sameIds(actual: string[], expected: string[]): boolean {
  const ids = new Set(expected);
  return (
    actual.length === expected.length && actual.every((value) => ids.has(value))
  );
}

function readAssignment(
  value: unknown,
  staffId: string,
): StaffDeactivationAssignment {
  const data = object(value);
  const replacementStaffId =
    data.replacementStaffId === null ? null : id(data.replacementStaffId);
  const replacementStaffName = nullableText(data.replacementStaffName);
  if (
    typeof data.isActive !== 'boolean' ||
    (data.isActive
      ? replacementStaffId === null
      : replacementStaffId !== null) ||
    (replacementStaffId === null) !== (replacementStaffName === null) ||
    replacementStaffId === staffId
  )
    throw invalidHandoverResponse();
  return {
    propertyId: id(data.propertyId),
    propertyName: text(data.propertyName),
    propertyRegion: nullableText(data.propertyRegion),
    isActive: data.isActive,
    replacementStaffId,
    replacementStaffName,
  };
}

function readAudit(value: unknown, staffId: string): StaffDeactivationAudit {
  const data = object(value);
  const actor = object(data.actor);
  const assignments = array(data.assignments).map((item) =>
    readAssignment(item, staffId),
  );
  if (
    new Set(assignments.map((item) => item.propertyId)).size !==
    assignments.length
  )
    throw invalidHandoverResponse();
  const reassignedPropertyIds = uniqueIds(data.reassignedPropertyIds);
  const clearedPropertyIds = uniqueIds(data.clearedPropertyIds);
  const staffQrReissuePropertyIds = uniqueIds(data.staffQrReissuePropertyIds);
  if (
    !sameIds(
      reassignedPropertyIds,
      assignments
        .filter((item) => item.isActive)
        .map((item) => item.propertyId),
    ) ||
    !sameIds(
      clearedPropertyIds,
      assignments
        .filter((item) => !item.isActive)
        .map((item) => item.propertyId),
    ) ||
    !sameIds(staffQrReissuePropertyIds, reassignedPropertyIds)
  )
    throw invalidHandoverResponse();
  return {
    id: id(data.id),
    deactivatedAt: timestamp(data.deactivatedAt),
    actor: { id: id(actor.id), name: text(actor.name) },
    assignments,
    revokedDraftCount: count(data.revokedDraftCount),
    reassignedPropertyIds,
    clearedPropertyIds,
    staffQrReissuePropertyIds,
  };
}

export function readStaffDeactivationPreview(
  value: unknown,
  staffId: string,
): StaffDeactivationPreview {
  const data = object(value);
  const staff = readAdminStaff(data.staff, staffId);
  if (
    typeof data.expectedStateToken !== 'string' ||
    !STATE_TOKEN.test(data.expectedStateToken)
  )
    throw invalidHandoverResponse();
  const properties = array(data.properties).map((value) => {
    const property = object(value);
    if (typeof property.isActive !== 'boolean') throw invalidHandoverResponse();
    return {
      id: id(property.id),
      name: text(property.name),
      region: nullableText(property.region),
      isActive: property.isActive,
      unfinishedDraftCount: count(property.unfinishedDraftCount),
    };
  });
  const unfinishedDraftCount = count(data.unfinishedDraftCount);
  const assigned = new Map(
    staff.assignedProperties.map((property) => [property.id, property]),
  );
  if (
    new Set(properties.map((property) => property.id)).size !==
      properties.length ||
    properties.length !== assigned.size ||
    properties.some((property) => {
      const expected = assigned.get(property.id);
      return (
        !expected ||
        expected.name !== property.name ||
        expected.region !== property.region ||
        expected.isActive !== property.isActive
      );
    }) ||
    properties.reduce(
      (total, property) => total + property.unfinishedDraftCount,
      0,
    ) > unfinishedDraftCount
  )
    throw invalidHandoverResponse();
  const latestDeactivation =
    data.latestDeactivation === null
      ? null
      : readAudit(data.latestDeactivation, staff.id);
  if (
    latestDeactivation &&
    Date.parse(latestDeactivation.deactivatedAt) > Date.parse(staff.updatedAt)
  )
    throw invalidHandoverResponse();
  return {
    staff,
    expectedStateToken: data.expectedStateToken,
    properties,
    unfinishedDraftCount,
    latestDeactivation,
  };
}

export function prepareStaffDeactivationInput(
  staffId: string,
  input: DeactivateStaffInput,
): DeactivateStaffInput {
  const invalid = () =>
    new ApiRequestError(
      '담당 직원과 인계할 휴양소를 다시 확인해 주세요.',
      400,
      'INVALID_STAFF_HANDOVER_INPUT',
    );
  if (
    !input ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    typeof input.expectedStateToken !== 'string' ||
    !STATE_TOKEN.test(input.expectedStateToken) ||
    !Array.isArray(input.assignments) ||
    input.assignments.length > MAX_ASSIGNMENTS
  )
    throw invalid();
  const assignments = input.assignments.map((item) => {
    if (
      !item ||
      typeof item !== 'object' ||
      Array.isArray(item) ||
      !isStaffId(item.propertyId) ||
      (item.replacementStaffId !== null &&
        !isStaffId(item.replacementStaffId)) ||
      item.replacementStaffId?.toLowerCase() === staffId
    )
      throw invalid();
    return {
      propertyId: item.propertyId.toLowerCase(),
      replacementStaffId: item.replacementStaffId?.toLowerCase() ?? null,
    };
  });
  if (
    new Set(assignments.map((item) => item.propertyId)).size !==
    assignments.length
  )
    throw invalid();
  return { expectedStateToken: input.expectedStateToken, assignments };
}

export function readStaffDeactivationResult(
  value: unknown,
  staffId: string,
  input: DeactivateStaffInput,
): StaffDeactivationResult {
  const data = object(value);
  const staff = readAdminStaff(data.staff, staffId);
  const audit = readAudit(data, staffId);
  const requested = new Map(
    input.assignments.map((item) => [item.propertyId, item.replacementStaffId]),
  );
  if (
    staff.isActive ||
    staff.assignedProperties.length !== 0 ||
    Date.parse(staff.updatedAt) < Date.parse(audit.deactivatedAt) ||
    audit.assignments.length !== requested.size ||
    audit.assignments.some(
      (item) =>
        !requested.has(item.propertyId) ||
        requested.get(item.propertyId) !== item.replacementStaffId,
    )
  )
    throw invalidHandoverResponse();
  return { staff, ...audit };
}
