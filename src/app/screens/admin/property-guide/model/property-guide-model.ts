import type {
  AdminPropertyGuideDto,
  SaveAdminPropertyGuideInput,
} from '../../../../features/admin-property-guides/admin-property-guide.types';
import {
  GUIDE_LIMITS,
  normalizeGuideContent,
  normalizeGuideTitle,
} from '../../../../features/admin-property-guides/admin-property-guide-validation';

export type GuideFormValues = {
  title: string;
  content: string;
  isPublished: boolean;
};
export type GuideFormErrors = Partial<Record<'title' | 'content', string>>;

export function createGuideValues(
  data: AdminPropertyGuideDto,
): GuideFormValues {
  return data.guide
    ? {
        title: data.guide.title,
        content: data.guide.content,
        isPublished: data.guide.isPublished,
      }
    : { title: '휴양소 이용 안내', content: '', isPublished: false };
}

export function normalizeGuideValues(values: GuideFormValues): GuideFormValues {
  return {
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
  if (!content) errors.content = '안내문 내용을 입력해 주세요.';
  else if (Array.from(content).length > GUIDE_LIMITS.content)
    errors.content = '내용은 20,000자 이내로 입력해 주세요.';
  else if (content.includes('\u0000'))
    errors.content = '내용에는 널 문자를 사용할 수 없습니다.';
  return errors;
}

export function buildGuideInput(
  data: AdminPropertyGuideDto,
  values: GuideFormValues,
): SaveAdminPropertyGuideInput | null {
  const normalized = normalizeGuideValues(values);
  const original = data.guide;
  if (
    original &&
    normalized.title === original.title &&
    normalized.content === original.content &&
    normalized.isPublished === original.isPublished
  )
    return null;
  return { expectedVersion: original?.version ?? 0, ...normalized };
}
