import { useId } from 'react';
import '../styles/property-checklists.css';

type PreviewSection = {
  key?: string;
  id?: string;
  title: string;
  items: ReadonlyArray<{
    key?: string;
    id?: string;
    label: string;
    required: boolean;
  }>;
};

export function ChecklistPreview({
  title,
  sections,
  archived = false,
}: {
  title: string;
  sections: ReadonlyArray<PreviewSection>;
  archived?: boolean;
}) {
  const headingId = useId();
  return (
    <section className="checklist-preview" aria-labelledby={headingId}>
      <header className="checklist-preview__heading">
        <p className="checklist-eyebrow">
          {archived ? '당시 저장된 구성' : '구성 미리보기'}
        </p>
        <h2 id={headingId}>{title.trim() || '체크리스트 제목'}</h2>
        <p>
          {archived
            ? '이 버전의 질문과 필수 여부입니다.'
            : '저장할 질문과 필수 여부를 확인해 주세요.'}
        </p>
      </header>
      {sections.length === 0 ? (
        <p className="checklist-preview__empty">
          구역을 추가하면 구성 미리보기가 표시됩니다.
        </p>
      ) : (
        <ol className="checklist-preview__sections">
          {sections.map((section, sectionIndex) => (
            <li
              key={section.key ?? section.id ?? sectionIndex}
              className="checklist-preview__section"
            >
              <h3>
                <span>{String(sectionIndex + 1).padStart(2, '0')}</span>
                {section.title.trim() || '구역 제목'}
              </h3>
              {section.items.length === 0 ? (
                <p className="checklist-preview__empty">
                  아직 점검 항목이 없습니다.
                </p>
              ) : (
                <ol className="checklist-preview__items">
                  {section.items.map((item, itemIndex) => (
                    <li key={item.key ?? item.id ?? itemIndex}>
                      <div className="checklist-preview__item-heading">
                        <span className="checklist-preview__number">
                          {itemIndex + 1}.
                        </span>
                        <p>{item.label.trim() || '점검 항목 문구'}</p>
                        {item.required && (
                          <span className="checklist-preview__required">
                            필수
                          </span>
                        )}
                      </div>
                      <div
                        className="checklist-preview__answers"
                        aria-label="응답 예시: 정상 또는 이상"
                      >
                        <span>정상</span>
                        <span>이상</span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
