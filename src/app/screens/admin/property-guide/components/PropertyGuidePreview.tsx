import { useId } from 'react';
import {
  normalizeGuideContent,
  normalizeGuideTitle,
} from '../../../../features/admin-property-guides/admin-property-guide-validation';
import { PropertyGuideContent } from '../../../../features/property-guide/components/PropertyGuideContent';
import '../styles/property-guide.css';

export function PropertyGuidePreview({
  title,
  content,
  isPublished,
  propertyActive,
  propertyName,
  onClose,
}: {
  title: string;
  content: string;
  isPublished: boolean;
  propertyActive: boolean;
  propertyName?: string;
  onClose?: () => void;
}) {
  const titleId = useId();
  const previewTitle = normalizeGuideTitle(title);
  const previewContent = normalizeGuideContent(content);
  return (
    <section
      id="guide-live-preview"
      className="property-guide-preview"
      aria-labelledby={titleId}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (
          event.key === 'Escape' &&
          onClose &&
          event.currentTarget
            .querySelector('.property-guide-preview__close')
            ?.getClientRects().length
        ) {
          event.preventDefault();
          onClose();
        }
      }}
    >
      <header className="property-guide-preview__heading">
        <h2 id={titleId}>미리보기</h2>
        {onClose && (
          <button
            type="button"
            className="property-guide-preview__close"
            onClick={onClose}
          >
            닫기
          </button>
        )}
      </header>
      <div className="property-guide-preview__phone">
        <div className="property-guide-preview__context">
          {propertyName && <p>{propertyName}</p>}
        </div>
        <article className="property-guide-preview__article">
          <h3
            className={
              previewTitle ? '' : 'property-guide-preview__placeholder'
            }
          >
            {previewTitle || '안내 제목'}
          </h3>
          <PropertyGuideContent
            content={previewContent}
            emptyText="안내 내용을 입력해 주세요."
          />
        </article>
      </div>
      <div className="property-guide-preview__notice">
        <span
          className={`property-guide-badge${isPublished && propertyActive ? ' property-guide-badge--active' : ''}`}
        >
          {!isPublished
            ? '저장 시 비공개'
            : propertyActive
              ? '저장 시 공개'
              : '휴양소 비활성 · 접근 중지'}
        </span>
      </div>
      {onClose && (
        <button
          type="button"
          className="property-guide-preview__return"
          onClick={onClose}
        >
          편집으로 돌아가기
        </button>
      )}
    </section>
  );
}
