import type {
  GuestDraftAnswers,
  GuestDraftDto,
} from '../../../../features/guest-drafts/guest-drafts.types';
import {
  changeDraftAnswer,
  changeDraftDetails,
} from '../model/guest-draft-model';
import { DraftAnswerField } from './DraftAnswerField';

export function GuestChecklistStep({
  draft,
  answers,
  disabled,
  edit,
}: {
  draft: GuestDraftDto;
  answers: GuestDraftAnswers;
  disabled: boolean;
  edit: (change: (answers: GuestDraftAnswers) => GuestDraftAnswers) => void;
}) {
  return (
    <div className="guest-draft-form">
      {draft.template.definition.sections.map((section, index) => (
        <section
          className="guest-draft-section"
          key={section.id}
          aria-labelledby={`draft-section-${section.id}`}
        >
          <h3 id={`draft-section-${section.id}`}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            {section.title}
          </h3>
          {section.items.map((item) => (
            <DraftAnswerField
              key={item.id}
              item={item}
              disabled={disabled}
              answer={answers.items.find((answer) => answer.itemId === item.id)}
              onValue={(value) =>
                edit((current) => changeDraftAnswer(current, item.id, value))
              }
              onDetails={(change) =>
                edit((current) => changeDraftDetails(current, item.id, change))
              }
            />
          ))}
        </section>
      ))}
      <details className="guest-flow-note">
        <summary>
          추가 전달 사항{' '}
          <span>선택{answers.generalNote ? ' · 작성됨' : ''}</span>
        </summary>
        <label htmlFor="draft-general-note">관리자에게 전달할 내용</label>
        <textarea
          id="draft-general-note"
          rows={3}
          maxLength={4000}
          disabled={disabled}
          placeholder="함께 전달할 내용이 있다면 남겨주세요."
          value={answers.generalNote ?? ''}
          onChange={(event) =>
            edit((current) => ({
              ...current,
              generalNote: event.target.value || null,
            }))
          }
        />
      </details>
    </div>
  );
}
