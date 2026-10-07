import { ApiRequestError } from '../../core/api/api-error';

export const PUBLIC_CONTACT_MAX_LENGTH = 32;
export const PUBLIC_CONTACT_HELP =
  '숫자 7~15자리, 공백과 하이픈(-), 맨 앞의 국가번호 기호(+)만 사용할 수 있습니다.';

export function normalizePublicContactPhone(value: string): string | null {
  // Only ordinary spaces are formatting. Controls and other whitespace stay
  // visible to validation, including at either edge of a pasted number.
  return value.replace(/^ +| +$/g, '') || null;
}

export function isPublicContactPhone(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    value.length > PUBLIC_CONTACT_MAX_LENGTH ||
    !/^\+?[0-9]+(?:[ -][0-9]+)*(?![\s\S])/u.test(value)
  )
    return false;
  const digits = value.replace(/[^0-9]/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

export function readPublicContactPhone(
  value: unknown,
  invalidResponse: () => Error,
): string | null {
  // Older APIs omit this newly optional public field. Never fall back to staff.
  if (value === undefined || value === null) return null;
  if (!isPublicContactPhone(value)) throw invalidResponse();
  return value;
}

export function requirePublicContactInput(value: unknown): string | null {
  const normalized =
    typeof value === 'string' ? normalizePublicContactPhone(value) : value;
  if (normalized === null || isPublicContactPhone(normalized))
    return normalized;
  throw new ApiRequestError(PUBLIC_CONTACT_HELP, 400, 'VALIDATION_ERROR', [
    { field: 'publicContactPhone', messages: [PUBLIC_CONTACT_HELP] },
  ]);
}

export function publicContactTel(value: unknown): string | null {
  return isPublicContactPhone(value)
    ? `tel:${value.replace(/[ -]/g, '')}`
    : null;
}

export function isPublicContactTel(value: unknown): value is string {
  return (
    typeof value === 'string' && /^tel:\+?[0-9]{7,15}(?![\s\S])/u.test(value)
  );
}
