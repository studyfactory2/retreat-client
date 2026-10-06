import type { StaffChecklistDto } from '../../../../features/staff-entry/staff-entry.types';
import { StaffIcon } from './StaffIcon';

export function StaffChecklistPreview({
  checklist,
}: {
  checklist: StaffChecklistDto;
}) {
  const itemCount = checklist.definition.sections.reduce(
    (count, section) => count + section.items.length,
    0,
  );
  return (
    <article className="staff-entry-template">
      <details className="staff-entry-preview">
        <summary>
          <span className="staff-entry-preview__label">
            <strong>{checklist.title}</strong>
            <span>{itemCount}개 항목</span>
          </span>
          <StaffIcon name="chevron" />
        </summary>
        <div className="staff-entry-preview__content">
          <p className="staff-entry-hint">
            시작 전 미리보기입니다. 필수 항목은 작성할 때 확인해 주세요.
          </p>
          {checklist.definition.sections.map((section) => (
            <section className="staff-entry-preview-section" key={section.id}>
              <h4>{section.title}</h4>
              <ul>
                {section.items.map((item) => (
                  <li key={item.id}>
                    <span>{item.label}</span>
                    {item.required && (
                      <span className="staff-entry-required">필수</span>
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
