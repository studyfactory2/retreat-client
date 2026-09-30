import { ApiRequestError } from '../../core/api/api-error';
import type { SaveAdminPropertyGuideInput } from './admin-property-guide.types';

export const GUIDE_LIMITS = { title: 100, content: 20_000 } as const;
export const MAX_GUIDE_VERSION = 2_147_483_647;
export const MAX_WRITABLE_GUIDE_VERSION = MAX_GUIDE_VERSION - 1;

export function isGuideId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export function requireGuidePropertyId(value: unknown): string {
  if (!isGuideId(value))
    throw new ApiRequestError(
      '휴양소 정보를 확인해 주세요.',
      400,
      'INVALID_PROPERTY_ID',
    );
  return value.toLowerCase();
}

export function normalizeGuideTitle(value: string): string {
  return value.trim();
}

export function normalizeGuideContent(value: string): string {
  return value.replace(/\r\n?/g, '\n').trim();
}

function invalidInput(field: string, message: string): never {
  throw new ApiRequestError(message, 400, 'INVALID_PROPERTY_GUIDE_INPUT', [
    { field, messages: [message] },
  ]);
}

export function invalidGuideResponse(): ApiRequestError {
  // A rejected success receipt can follow a committed write: require rereading
  // the saved version before another save, never an automatic retry.
  return new ApiRequestError(
    '안내문 응답을 확인할 수 없습니다. 최신 정보를 다시 불러와 주세요.',
    200,
    'INVALID_PROPERTY_GUIDE_RESPONSE',
  );
}

export function prepareSaveAdminPropertyGuide(
  input: SaveAdminPropertyGuideInput,
): SaveAdminPropertyGuideInput {
  if (typeof input !== 'object' || input === null || Array.isArray(input))
    invalidInput('guide', '안내문 입력 형식을 확인해 주세요.');
  if (
    !Number.isInteger(input.expectedVersion) ||
    input.expectedVersion < 0 ||
    input.expectedVersion > MAX_WRITABLE_GUIDE_VERSION
  )
    invalidInput('expectedVersion', '최신 안내문 버전을 확인해 주세요.');
  if (typeof input.title !== 'string')
    invalidInput('title', '안내문 제목은 문자열이어야 합니다.');
  if (typeof input.content !== 'string')
    invalidInput('content', '안내문 내용은 문자열이어야 합니다.');
  if (typeof input.isPublished !== 'boolean')
    invalidInput('isPublished', '공개 여부를 확인해 주세요.');
  const title = normalizeGuideTitle(input.title);
  const content = normalizeGuideContent(input.content);
  if (!title) invalidInput('title', '안내문 제목을 입력해 주세요.');
  if ([...title].length > GUIDE_LIMITS.title)
    invalidInput('title', '안내문 제목은 100자 이하여야 합니다.');
  if (/[\r\n]/.test(title))
    invalidInput('title', '안내문 제목에는 줄바꿈을 사용할 수 없습니다.');
  if (title.includes('\u0000'))
    invalidInput('title', '안내문 제목에는 널 문자를 사용할 수 없습니다.');
  if (!content) invalidInput('content', '안내문 내용을 입력해 주세요.');
  if ([...content].length > GUIDE_LIMITS.content)
    invalidInput('content', '안내문 내용은 20,000자 이하여야 합니다.');
  if (content.includes('\u0000'))
    invalidInput('content', '안내문 내용에는 널 문자를 사용할 수 없습니다.');
  return {
    expectedVersion: input.expectedVersion,
    title,
    content,
    isPublished: input.isPublished,
  };
}
