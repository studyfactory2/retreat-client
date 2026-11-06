import type { StaffChecklistDto } from '../../../../features/staff-entry/staff-entry.types';
import { StaffIcon } from './StaffIcon';

export function StaffChecklistPreview({
  checklist,
  expanded = false,
}: {
  checklist: StaffChecklistDto;
  expanded?: boolean;
}) {
  const sections = checklist.definition.sections;
  const itemCount = sections.reduce(
    (count, section) => count + section.items.length,
    0,
  );
  const label = (
    <span className="staff-entry-preview__label">
      <strong>{checklist.title}</strong>
      <span>
        버전 {checklist.version} · {itemCount}개 항목
      </span>
    </span>
  );
  const questions = (
    <div className="staff-entry-preview__content">
      {sections.map((section) => (
        <section
          className="staff-entry-preview-section"
          key={section.id}
          aria-label={section.title}
        >
          {(sections.length > 1 || section.title !== checklist.title) && (
            <h3>{section.title}</h3>
          )}
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
  );
  return (
    <article className="staff-entry-template">
      {expanded ? (
        <>
          {label}
          {questions}
        </>
      ) : (
        <details className="staff-entry-preview">
          <summary>
            {label}
            <StaffIcon name="chevron" />
          </summary>
          {questions}
        </details>
      )}
    </article>
  );
}
