import {
  GUIDE_LIMITS,
  normalizeGuideContent,
  normalizeGuideTitle,
} from '../../../../features/admin-property-guides/admin-property-guide-validation';
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
  const titleCount = [...normalizeGuideTitle(values.title)].length;
  const contentCount = [...normalizeGuideContent(values.content)].length;
  return (
    <fieldset className="property-guide-form" disabled={disabled}>
      <legend className="property-guide-visually-hidden">
        이용 안내 내용과 공개 설정
      </legend>
      <section
        className="property-guide-form__content"
        aria-labelledby="guide-form-heading"
      >
        <div className="property-guide-form__heading">
          <p className="property-guide-eyebrow">PROPERTY GUIDE</p>
          <h2 id="guide-form-heading">이용객에게 전할 안내</h2>
          <p>시설 이용 방법과 머무는 동안 필요한 공통 안내를 작성해 주세요.</p>
        </div>
        <div className="property-guide-field">
          <label htmlFor="guide-title">
            안내 제목 <span>필수</span>
          </label>
          <input
            id="guide-title"
            value={values.title}
            aria-required="true"
            aria-invalid={!!errors.title}
            aria-describedby={`guide-title-hint guide-title-count${errors.title ? ' guide-title-error' : ''}`}
            placeholder="예: 휴양소 이용 안내"
            onChange={(event) =>
              onChange({ ...values, title: event.target.value })
            }
          />
          <div className="property-guide-field__meta">
            <p id="guide-title-hint">줄바꿈 없이 제목을 입력해 주세요.</p>
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
          <label htmlFor="guide-content">
            안내 내용 <span>필수</span>
          </label>
          <textarea
            id="guide-content"
            rows={16}
            value={values.content}
            aria-required="true"
            aria-invalid={!!errors.content}
            aria-describedby={`guide-content-hint guide-content-count${errors.content ? ' guide-content-error' : ''}`}
            placeholder="이용객에게 공통으로 안내할 내용을 입력하세요."
            onChange={(event) =>
              onChange({ ...values, content: event.target.value })
            }
          />
          <div className="property-guide-field__meta">
            <p id="guide-content-hint">
              줄바꿈은 유지됩니다. HTML이나 마크다운은 일반 글자로 표시됩니다.
            </p>
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
        <p className="property-guide-form__hint">
          앞뒤 공백을 제외한 글자 수입니다. 비공개로 저장할 때도 제목과 내용이
          필요합니다.
        </p>
      </section>
      <section
        className="property-guide-publish"
        aria-labelledby="guide-publish-heading"
      >
        <h2 id="guide-publish-heading">공개 설정</h2>
        <label className="property-guide-publish__toggle">
          <input
            type="checkbox"
            checked={values.isPublished}
            aria-label="이용객에게 안내 공개"
            aria-describedby="guide-publish-description"
            onChange={(event) =>
              onChange({ ...values, isPublished: event.target.checked })
            }
          />
          <span>이용객에게 안내 공개</span>
          <span
            className={`property-guide-badge${values.isPublished ? ' property-guide-badge--active' : ''}`}
          >
            {values.isPublished ? '공개로 저장 예정' : '비공개로 저장 예정'}
          </span>
        </label>
        <p id="guide-publish-description">
          {values.isPublished
            ? '공개 상태로 저장하면 이 내용이 이용객에게 제공되는 최신 안내가 됩니다.'
            : '비공개로 저장하면 관리자만 내용을 보관하며 이용객에게는 안내가 표시되지 않습니다.'}
        </p>
        <p className="property-guide-publish__single-copy">
          공개용과 초안용 사본이 따로 저장되지 않습니다. 저장할 때 기존 안내
          내용과 공개 설정이 함께 바뀝니다.
        </p>
        {!propertyActive && (
          <p className="property-guide-publish__inactive">
            비활성 휴양소도 안내를 작성하고 저장할 수 있습니다. 공개로 저장해도
            휴양소가 비활성인 동안 이용객은 접근할 수 없습니다.
          </p>
        )}
      </section>
    </fieldset>
  );
}
