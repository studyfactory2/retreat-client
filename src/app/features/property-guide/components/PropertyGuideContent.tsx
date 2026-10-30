import { parseGuideSections, type GuideSection } from '../guide-sections';
import '../styles/property-guide-content.css';

type Props = { content: string; emptyText?: string };

function GuideSectionIcon({ id }: { id: GuideSection['id'] }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {id === 'essentials' && (
        <>
          <path d="m12 3 10 18H2L12 3Z" />
          <path d="M12 9v5m0 3h.01" />
        </>
      )}
      {id === 'parking' && (
        <>
          <rect x="4" y="3" width="16" height="18" rx="3" />
          <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
        </>
      )}
      {id === 'wifi' && (
        <>
          <path d="M3 9a14 14 0 0 1 18 0M6 12a9 9 0 0 1 12 0m-9 3a4.5 4.5 0 0 1 6 0" />
          <circle cx="12" cy="18" r="1" />
        </>
      )}
      {id === 'facilities' && (
        <path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7" />
      )}
      {id === 'rules' && (
        <>
          <rect x="5" y="4" width="14" height="17" rx="2" />
          <path d="M9 4V2h6v2M8 10h1m3 0h4m-8 5h1m3 0h4" />
        </>
      )}
      {id === 'checkout' && <path d="M10 4H4v16h6m-1-8h12m-4-4 4 4-4 4" />}
      {id === 'other' && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v6m0-10h.01" />
        </>
      )}
    </svg>
  );
}

/** One plain-text reader for the published guest guide and administrator preview. */
export function PropertyGuideContent({ content, emptyText }: Props) {
  const sections = parseGuideSections(content);
  const populated = sections?.filter((section) => section.content.trim());
  const essentials = populated?.find((section) => section.id === 'essentials');
  const expandable = populated?.filter(
    (section) => section.id !== 'essentials',
  );
  const empty = sections ? populated?.length === 0 : !content.trim();

  return (
    <div className="property-guide-content">
      {empty ? (
        <p className="property-guide-content__empty">
          {emptyText ?? '아직 작성된 안내가 없습니다.'}
        </p>
      ) : !sections ? (
        <div className="property-guide-content__text property-guide-content__legacy">
          {content}
        </div>
      ) : (
        <>
          {essentials && (
            <section
              className="property-guide-content__notice"
              aria-label={essentials.title}
            >
              <div className="property-guide-content__notice-heading">
                <GuideSectionIcon id="essentials" />
                <strong>{essentials.title}</strong>
              </div>
              <div className="property-guide-content__text">
                {essentials.content}
              </div>
            </section>
          )}
          {!!expandable?.length && (
            <div className="property-guide-content__sections">
              {expandable.map((section) => (
                <details
                  className="property-guide-content__section"
                  key={section.id}
                >
                  <summary>
                    <span className="property-guide-content__icon">
                      <GuideSectionIcon id={section.id} />
                    </span>
                    <span className="property-guide-content__label">
                      <strong>{section.title}</strong>
                      <span
                        className="property-guide-content__preview"
                        aria-hidden="true"
                      >
                        {section.content.replace(/\s+/g, ' ').trim()}
                      </span>
                    </span>
                    <svg
                      className="property-guide-content__chevron"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path d="m7 10 5 5 5-5" />
                    </svg>
                  </summary>
                  <div className="property-guide-content__text property-guide-content__body">
                    {section.content}
                  </div>
                </details>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
