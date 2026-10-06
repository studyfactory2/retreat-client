import type { StaffChecklistDto } from '../../../../features/staff-entry/staff-entry.types';
import { StaffIcon } from './StaffIcon';

export function StaffChecklistPreview({
  checklist,
}: {
  checklist: StaffChecklistDto;
}) {
  return (
    <article className="staff-entry-template">
      <div className="staff-entry-template__title">
        <StaffIcon name="checklist" />
        <h3>{checklist.title}</h3>
      </div>
      <details className="staff-entry-preview">
        <summary>
          <span className="staff-entry-preview__closed">항목 미리보기</span>
          <span className="staff-entry-preview__open">미리보기 접기</span>
          <StaffIcon name="chevron" />
        </summary>
        <div className="staff-entry-preview__content">
          <p className="staff-entry-hint">
            ‘필수 항목’은 작성 시 확인이 필요한 항목 표시입니다. 현재 확인·완료
            여부를 나타내지 않습니다.
          </p>
          {checklist.definition.sections.map((section) => (
            <section className="staff-entry-preview-section" key={section.id}>
              <h4>{section.title}</h4>
              <ul>
                {section.items.map((item) => (
                  <li key={item.id}>
                    <span>{item.label}</span>
                    {item.required && (
                      <span className="staff-entry-required">필수 항목</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </details>
    </article>
  );
}
