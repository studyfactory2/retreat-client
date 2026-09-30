import { useId } from 'react';
import {
  normalizeGuideContent,
  normalizeGuideTitle,
} from '../../../../features/admin-property-guides/admin-property-guide-validation';
import '../styles/property-guide.css';

export function PropertyGuidePreview({
  title,
  content,
  isPublished,
  propertyActive,
  propertyName,
}: {
  title: string;
  content: string;
  isPublished: boolean;
  propertyActive: boolean;
  propertyName?: string;
}) {
  const titleId = useId();
  const previewTitle = normalizeGuideTitle(title);
  const previewContent = normalizeGuideContent(content);
  return (
    <section className="property-guide-preview" aria-labelledby={titleId}>
      <header className="property-guide-preview__heading">
        <p className="property-guide-eyebrow">MOBILE PREVIEW</p>
        <h2 id={titleId}>입력 내용 미리보기</h2>
        <p>휴대폰 너비에서 글의 흐름과 줄바꿈을 확인하세요.</p>
      </header>
      <div className="property-guide-preview__phone">
        <div className="property-guide-preview__context">
          <span>이용 안내</span>
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
          <div
            className={`property-guide-preview__text${previewContent ? '' : ' property-guide-preview__placeholder'}`}
          >
            {previewContent || '작성한 안내 내용이 여기에 표시됩니다.'}
          </div>
        </article>
      </div>
      <div className="property-guide-preview__notice">
        <span
          className={`property-guide-badge${isPublished && propertyActive ? ' property-guide-badge--active' : ''}`}
        >
          {!isPublished
            ? '비공개로 저장 예정'
            : propertyActive
              ? '공개로 저장 예정'
              : '공개 설정 · 접근 중지'}
        </span>
        <p>
          현재 입력한 내용의 관리자용 미리보기입니다. 실제 공개 여부는 저장한
          설정에 따릅니다.
        </p>
      </div>
    </section>
  );
}
