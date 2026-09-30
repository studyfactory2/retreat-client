import type {
  AdminPropertyGuideDto,
  SaveAdminPropertyGuideInput,
} from './admin-property-guide.types';
import {
  GUIDE_LIMITS,
  invalidGuideResponse,
  isGuideId,
  MAX_GUIDE_VERSION,
  normalizeGuideContent,
  normalizeGuideTitle,
} from './admin-property-guide-validation';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isText(value: unknown, maximum: number): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.trim() === value &&
    [...value].length <= maximum
  );
}

function isTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}

function readGuide(value: unknown): AdminPropertyGuideDto['guide'] {
  if (value === null) return null;
  if (
    !isRecord(value) ||
    !isText(value.title, GUIDE_LIMITS.title) ||
    normalizeGuideTitle(value.title) !== value.title ||
    /[\r\n]/.test(value.title) ||
    value.title.includes('\u0000') ||
    !isText(value.content, GUIDE_LIMITS.content) ||
    normalizeGuideContent(value.content) !== value.content ||
    value.content.includes('\u0000') ||
    typeof value.isPublished !== 'boolean' ||
    typeof value.version !== 'number' ||
    !Number.isInteger(value.version) ||
    value.version < 1 ||
    value.version > MAX_GUIDE_VERSION ||
    !isGuideId(value.updatedByUserId) ||
    !isTimestamp(value.createdAt) ||
    !isTimestamp(value.updatedAt) ||
    Date.parse(value.updatedAt) < Date.parse(value.createdAt)
  )
    throw invalidGuideResponse();
  return {
    title: value.title,
    content: value.content,
    isPublished: value.isPublished,
    version: value.version,
    updatedByUserId: value.updatedByUserId.toLowerCase(),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

export function readAdminPropertyGuide(
  value: unknown,
  expectedPropertyId: string,
): AdminPropertyGuideDto {
  if (
    !isRecord(value) ||
    !isRecord(value.property) ||
    !isGuideId(expectedPropertyId) ||
    !isGuideId(value.property.id) ||
    value.property.id.toLowerCase() !== expectedPropertyId.toLowerCase() ||
    !isText(value.property.name, 100) ||
    (value.property.region !== null && !isText(value.property.region, 100)) ||
    typeof value.property.isActive !== 'boolean'
  )
    throw invalidGuideResponse();
  return {
    property: {
      id: value.property.id.toLowerCase(),
      name: value.property.name,
      region: value.property.region,
      isActive: value.property.isActive,
    },
    guide: readGuide(value.guide),
  };
}

export function verifySavedPropertyGuide(
  response: AdminPropertyGuideDto,
  input: SaveAdminPropertyGuideInput,
): void {
  if (
    !response.guide ||
    response.guide.version !== input.expectedVersion + 1 ||
    response.guide.title !== input.title ||
    response.guide.content !== input.content ||
    response.guide.isPublished !== input.isPublished
  )
    throw invalidGuideResponse();
}
