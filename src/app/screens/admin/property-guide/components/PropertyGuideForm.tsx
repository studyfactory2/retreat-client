import { useState } from 'react';
import {
  GUIDE_LIMITS,
  normalizeGuideContent,
  normalizeGuideTitle,
} from '../../../../features/admin-property-guides/admin-property-guide-validation';
import {
  createGuideSections,
  guideSectionsToPlainText,
  parseGuideSections,
  serializeGuideSections,
} from '../../../../features/property-guide/guide-sections';
import { Button } from '../../../../shared/ui/Button/Button';
import type {
  GuideFormErrors,
  GuideFormValues,
} from '../model/property-guide-model';
import '../styles/property-guide.css';

export function PropertyGuideForm({
  values,
  onChange,
  errors,
  disabled,
  propertyActive,
}: {
  values: GuideFormValues;
  onChange: (values: GuideFormValues) => void;
  errors: GuideFormErrors;
  disabled: boolean;
  propertyActive: boolean;
}) {
  const [formatNotice, setFormatNotice] = useState<string | null>(null);
  const titleCount = [...normalizeGuideTitle(values.title)].length;
  const contentCount = [...normalizeGuideContent(values.content)].length;
  const sections = parseGuideSections(values.content);
  const templateContent = sections
    ? null
    : serializeGuideSections(createGuideSections(values.content));
  const templateTooLong =
    templateContent !== null &&
    [...normalizeGuideContent(templateContent)].length > GUIDE_LIMITS.content;

  function changeFormat(content: string, notice: string | null = null) {
    onChange({ ...values, content });
    setFormatNotice(notice);
    requestAnimationFrame(() =>
      document.getElementById('guide-content')?.focus(),
    );
  }
  return (
    <fieldset className="property-guide-form" disabled={disabled}>
      <legend className="property-guide-visually-hidden">
        이용 안내 내용과 공개 설정
      </legend>
      <section className="property-guide-form__content" aria-label="안내 작성">
        <div className="property-guide-field">
          <label htmlFor="guide-title">
            제목 <span aria-hidden="true">*</span>
            <span className="property-guide-visually-hidden">필수</span>
          </label>
          <input
            id="guide-title"
            value={values.title}
            aria-required="true"
            aria-invalid={!!errors.title}
            aria-describedby={`guide-title-count${errors.title ? ' guide-title-error' : ''}`}
            placeholder="예: 휴양소 이용 안내"
            onChange={(event) =>
              onChange({ ...values, title: event.target.value })
            }
          />
          <div className="property-guide-field__meta">
            <span
              id="guide-title-count"
              className={
                titleCount > GUIDE_LIMITS.title
                  ? 'property-guide-field__count--over'
                  : ''
              }
            >
              {titleCount.toLocaleString('ko-KR')} / {GUIDE_LIMITS.title}자
            </span>
          </div>
          {errors.title && (
            <p
              className="property-guide-field__error"
              id="guide-title-error"
              role="alert"
            >
              {errors.title}
            </p>
          )}
        </div>
        <div className="property-guide-field">
          <div className="property-guide-format">
            <div>
              <p
                id="guide-content-label"
                className="property-guide-field__label"
              >
                내용 <span aria-hidden="true">*</span>
                <span className="property-guide-visually-hidden">필수</span>
              </p>
            </div>
            <Button
              type="button"
              className="admin-button-secondary property-guide-format__button"
              disabled={templateTooLong}
              aria-describedby={
                templateTooLong ? 'guide-template-limit' : undefined
              }
              onClick={() => {
                if (sections) changeFormat(guideSectionsToPlainText(sections));
                else if (templateContent !== null && !templateTooLong)
                  changeFormat(
                    templateContent,
                    values.content.trim()
                      ? '기존 글을 ‘기타 안내’에 담았습니다.'
                      : null,
                  );
              }}
            >
              {sections ? '한 편으로 작성' : '구분해서 작성'}
            </Button>
          </div>
          {formatNotice && sections && (
            <p className="property-guide-format__notice" role="status">
              {formatNotice}
            </p>
          )}
          {templateTooLong && (
            <p
              id="guide-template-limit"
              className="property-guide-field__error"
            >
              구분 제목을 넣을 공간이 부족합니다. 내용을 조금 줄인 뒤
              사용하세요.
            </p>
          )}
          {sections ? (
            <div
              id="guide-content"
              className="property-guide-sections"
              role="group"
              tabIndex={-1}
              aria-labelledby="guide-content-label"
              aria-invalid={!!errors.content}
              aria-describedby={`guide-content-count${errors.content ? ' guide-content-error' : ''}`}
            >
              {sections.map((section) => (
                <details
                  key={section.id}
                  className="property-guide-section"
                  open={section.id === 'essentials'}
                >
                  <summary>
                    <span className="property-guide-section__name">
                      <strong>{section.title}</strong>
                      {section.id === 'essentials' && (
                        <small>항상 펼쳐서 표시</small>
                      )}
                    </span>
                    <span
                      className={`property-guide-section__state${section.content.trim() ? ' property-guide-section__state--written' : ''}`}
                    >
                      {section.content.trim() ? '작성됨' : '비어 있음'}
                    </span>
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="m7 10 5 5 5-5" />
                    </svg>
                  </summary>
                  <div className="property-guide-section__body">
                    <label
                      className="property-guide-visually-hidden"
                      htmlFor={`guide-section-${section.id}`}
                    >
                      {section.title} 내용
                    </label>
                    <textarea
                      id={`guide-section-${section.id}`}
                      rows={4}
                      value={section.content}
                      placeholder={
                        section.id === 'essentials'
                          ? '이용객이 꼭 알아야 할 내용을 짧게 적어 주세요.'
                          : '안내할 내용이 있을 때 작성하세요.'
                      }
                      onChange={(event) => {
                        setFormatNotice(null);
                        onChange({
                          ...values,
                          content: serializeGuideSections(
                            sections.map((item) =>
                              item.id === section.id
                                ? { ...item, content: event.target.value }
                                : item,
                            ),
                          ),
                        });
                      }}
                    />
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <textarea
              id="guide-content"
              rows={7}
              value={values.content}
              aria-labelledby="guide-content-label"
              aria-required="true"
              aria-invalid={!!errors.content}
              aria-describedby={`guide-content-count${errors.content ? ' guide-content-error' : ''}`}
              placeholder="안내 내용을 입력하세요."
              onChange={(event) =>
                onChange({ ...values, content: event.target.value })
              }
            />
          )}
          <div className="property-guide-field__meta">
            <span
              id="guide-content-count"
              className={
                contentCount > GUIDE_LIMITS.content
                  ? 'property-guide-field__count--over'
                  : ''
              }
            >
              {contentCount.toLocaleString('ko-KR')} /{' '}
              {GUIDE_LIMITS.content.toLocaleString('ko-KR')}자
            </span>
          </div>
          {errors.content && (
            <p
              className="property-guide-field__error"
              id="guide-content-error"
              role="alert"
            >
              {errors.content}
            </p>
          )}
        </div>
      </section>
      <section
        className="property-guide-publish property-guide-publish--compact"
        aria-label="공개 설정"
      >
        <label className="property-guide-publish__toggle">
          <span>이용객에게 공개</span>
          <input
            type="checkbox"
            role="switch"
            checked={values.isPublished}
            aria-label="이용객에게 공개"
            aria-describedby="guide-publish-description"
            onChange={(event) =>
              onChange({ ...values, isPublished: event.target.checked })
            }
          />
        </label>
        <p id="guide-publish-description">
          {values.isPublished
            ? '저장하면 이용객 안내에 바로 반영됩니다.'
            : '저장하면 이용객에게 표시되지 않습니다.'}
        </p>
        {!propertyActive && (
          <p className="property-guide-publish__inactive">
            비활성 휴양소는 공개로 저장해도 이용객이 볼 수 없습니다.
          </p>
        )}
      </section>
    </fieldset>
  );
}
