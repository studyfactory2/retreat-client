import type { GuidePdfMetadata } from '../../../../features/property-guide/guide-pdf';
import type {
  AdminPropertyGuideDto,
  SaveAdminPropertyGuideInput,
  SaveAdminPropertyGuidePdfInput,
} from '../../../../features/admin-property-guides/admin-property-guide.types';
import { hasGuideContent } from '../../../../features/property-guide/guide-sections';
import {
  GUIDE_LIMITS,
  normalizeGuideContent,
  normalizeGuideTitle,
} from '../../../../features/admin-property-guides/admin-property-guide-validation';

export type GuideFormValues = {
  title: string;
  content: string;
  type: 'TEXT' | 'PDF';
  pdf: GuidePdfMetadata | null;
  file: File | null;
  isPublished: boolean;
};
export type GuideFormErrors = Partial<
  Record<'title' | 'content' | 'pdf', string>
>;

export function createGuideValues(
  data: AdminPropertyGuideDto,
): GuideFormValues {
  return data.guide
    ? {
        title: data.guide.title,
        content: data.guide.content,
        type: data.guide.type,
        pdf: data.guide.pdf,
        file: null,
        isPublished: data.guide.isPublished,
      }
    : {
        title: '휴양소 이용 안내',
        content: '',
        type: 'TEXT',
        pdf: null,
        file: null,
        isPublished: false,
      };
}

export function normalizeGuideValues(values: GuideFormValues): GuideFormValues {
  return {
    ...values,
    title: normalizeGuideTitle(values.title),
    content: normalizeGuideContent(values.content),
    isPublished: values.isPublished,
  };
}

export function validateGuideForm(values: GuideFormValues): GuideFormErrors {
  const { title, content } = normalizeGuideValues(values);
  const errors: GuideFormErrors = {};
  if (!title) errors.title = '안내문 제목을 입력해 주세요.';
  else if (Array.from(title).length > GUIDE_LIMITS.title)
    errors.title = '제목은 100자 이내로 입력해 주세요.';
  else if (/[\r\n]/u.test(title) || title.includes('\u0000'))
    errors.title = '제목에는 줄바꿈이나 널 문자를 사용할 수 없습니다.';
  if (values.type === 'TEXT' && !hasGuideContent(content))
    errors.content = '안내문 내용을 입력해 주세요.';
  else if (Array.from(content).length > GUIDE_LIMITS.content)
    errors.content = '내용은 20,000자 이내로 입력해 주세요.';
  else if (content.includes('\u0000'))
    errors.content = '내용에는 널 문자를 사용할 수 없습니다.';
  if (values.type === 'PDF' && !values.pdf)
    errors.pdf = '안내할 PDF 파일을 선택해 주세요.';
  return errors;
}

export function buildGuideInput(
  data: AdminPropertyGuideDto,
  values: GuideFormValues,
):
  | (
      | { type: 'TEXT'; input: SaveAdminPropertyGuideInput }
      | { type: 'PDF'; input: SaveAdminPropertyGuidePdfInput }
    )
  | null {
  const normalized = normalizeGuideValues(values);
  const original = data.guide;
  if (
    original &&
    normalized.type === original.type &&
    !normalized.file &&
    (normalized.type !== 'PDF' || !!normalized.pdf) &&
    normalized.title === original.title &&
    normalized.content === original.content &&
    normalized.isPublished === original.isPublished
  )
    return null;
  const input = {
    expectedVersion: original?.version ?? 0,
    title: normalized.title,
    content: normalized.content,
    isPublished: normalized.isPublished,
  };
  return normalized.type === 'PDF'
    ? {
        type: 'PDF',
        input: {
          ...input,
          ...(normalized.file ? { file: normalized.file } : {}),
        },
      }
    : { type: 'TEXT', input };
}
