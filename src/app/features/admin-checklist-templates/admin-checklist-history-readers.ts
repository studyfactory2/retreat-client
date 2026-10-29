import { ApiRequestError } from '../../core/api/api-error';
import { readChecklistDefinition } from './admin-checklist-template-readers';
import {
  CHECKLIST_LIMITS,
  isChecklistId,
  isChecklistType,
  MAX_CHECKLIST_VERSION,
} from './admin-checklist-template-validation';
import type {
  ChecklistVersionDetail,
  ChecklistVersionHistory,
  ChecklistVersionSummary,
} from './admin-checklist-history.types';

export const CHECKLIST_HISTORY_PAGE_SIZE = 10;
export const MAX_CHECKLIST_HISTORY_PAGE = 100_000;

function invalidResponse(): ApiRequestError {
  return new ApiRequestError(
    '체크리스트 버전 이력을 확인할 수 없습니다. 다시 불러와 주세요.',
    200,
    'INVALID_CHECKLIST_HISTORY_RESPONSE',
  );
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw invalidResponse();
  return value as Record<string, unknown>;
}

function text(value: unknown, maximum: number): string {
  if (
    typeof value !== 'string' ||
    !value.trim() ||
    value.trim() !== value ||
    [...value].length > maximum
  )
    throw invalidResponse();
  return value;
}

function id(value: unknown): string {
  if (!isChecklistId(value)) throw invalidResponse();
  return value.toLowerCase();
}

function integer(value: unknown, minimum: number, maximum: number): number {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < minimum ||
    value > maximum
  )
    throw invalidResponse();
  return value;
}

function timestamp(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString() !== value
  )
    throw invalidResponse();
  return value;
}

function readSummary(value: unknown): ChecklistVersionSummary {
  const data = object(value);
  if (
    typeof data.isActive !== 'boolean' ||
    (data.source !== 'PUBLISHED' && data.source !== 'BASELINE') ||
    (data.source === 'BASELINE' ? data.actor !== null : data.actor === null)
  )
    throw invalidResponse();
  const actor = data.actor === null ? null : object(data.actor);
  const sectionCount = integer(data.sectionCount, 1, CHECKLIST_LIMITS.sections);
  const itemCount = integer(
    data.itemCount,
    sectionCount,
    Math.min(
      CHECKLIST_LIMITS.totalItems,
      sectionCount * CHECKLIST_LIMITS.itemsPerSection,
    ),
  );
  return {
    version: integer(data.version, 1, MAX_CHECKLIST_VERSION),
    title: text(data.title, CHECKLIST_LIMITS.title),
    isActive: data.isActive,
    publishedAt: timestamp(data.publishedAt),
    source: data.source,
    actor: actor ? { id: id(actor.id), name: text(actor.name, 100) } : null,
    sectionCount,
    itemCount,
  };
}

export function requireChecklistHistoryPage(value: unknown): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > MAX_CHECKLIST_HISTORY_PAGE
  )
    throw new ApiRequestError(
      '버전 이력 페이지를 확인해 주세요.',
      400,
      'INVALID_CHECKLIST_HISTORY_PAGE',
    );
  return value;
}

export function requireChecklistHistoryVersion(value: unknown): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > MAX_CHECKLIST_VERSION
  )
    throw new ApiRequestError(
      '체크리스트 버전을 확인해 주세요.',
      400,
      'INVALID_CHECKLIST_HISTORY_VERSION',
    );
  return value;
}

export function readChecklistVersionHistory(
  value: unknown,
  expectedTemplateId: string,
  expectedPage: number,
): ChecklistVersionHistory {
  const data = object(value);
  const templateId = id(data.templateId);
  const currentVersion = integer(data.currentVersion, 1, MAX_CHECKLIST_VERSION);
  const total = integer(data.total, 1, currentVersion);
  const totalPages = Math.ceil(total / CHECKLIST_HISTORY_PAGE_SIZE);
  const page = requireChecklistHistoryPage(expectedPage);
  const expectedLength = Math.max(
    0,
    Math.min(
      CHECKLIST_HISTORY_PAGE_SIZE,
      total - (page - 1) * CHECKLIST_HISTORY_PAGE_SIZE,
    ),
  );
  if (
    templateId !== expectedTemplateId.toLowerCase() ||
    data.page !== page ||
    data.limit !== CHECKLIST_HISTORY_PAGE_SIZE ||
    data.totalPages !== totalPages ||
    !Array.isArray(data.items) ||
    data.items.length !== expectedLength
  )
    throw invalidResponse();
  const items = data.items.map(readSummary);
  if (
    items.some((item, index) => {
      const position = (page - 1) * CHECKLIST_HISTORY_PAGE_SIZE + index;
      return (
        item.version !== currentVersion - position ||
        (item.source === 'BASELINE' && position !== total - 1)
      );
    })
  )
    throw invalidResponse();
  return {
    templateId,
    currentVersion,
    items,
    total,
    page,
    limit: CHECKLIST_HISTORY_PAGE_SIZE,
    totalPages,
  };
}

export function readChecklistVersion(
  value: unknown,
  expectedTemplateId: string,
  expectedVersion: number,
): ChecklistVersionDetail {
  const data = object(value);
  const summary = readSummary(data);
  const templateId = id(data.templateId);
  if (
    templateId !== expectedTemplateId.toLowerCase() ||
    summary.version !== expectedVersion ||
    !isChecklistType(data.type)
  )
    throw invalidResponse();
  const definition = readChecklistDefinition(data.definition);
  if (
    definition.sections.length !== summary.sectionCount ||
    definition.sections.reduce(
      (sum, section) => sum + section.items.length,
      0,
    ) !== summary.itemCount
  )
    throw invalidResponse();
  return {
    ...summary,
    templateId,
    propertyId: id(data.propertyId),
    type: data.type,
    definition,
  };
}
