import { Fragment } from 'react';
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
  showMissing,
  edit,
  onIssuePhotos,
  photoPickerDisabled,
  photoStatus,
  onOpenPhotos,
}: {
  photoStatus: (itemId: string) => string;
  onOpenPhotos: () => void;
  onIssuePhotos?: (files: FileList, itemId: string) => void;
  photoPickerDisabled: boolean;
  showMissing: boolean;
  draft: GuestDraftDto;
  answers: GuestDraftAnswers;
  disabled: boolean;
  edit: (change: (answers: GuestDraftAnswers) => GuestDraftAnswers) => void;
}) {
  const sections = draft.template.definition.sections;
  return (
    <div className="guest-draft-form">
      {sections.map((section) => (
        <section
          className="guest-draft-section"
          key={section.id}
          aria-labelledby={sections.length === 1 ? 'guest-checklist-title' : `draft-section-${section.id}`}
        >
          {sections.length > 1 && <h4 id={`draft-section-${section.id}`}>{section.title}</h4>}
          {section.items.map((item) => {
            const status = onIssuePhotos && photoStatus(item.id);
            return (
              <Fragment key={item.id}>
                <DraftAnswerField
                  item={item}
                  disabled={disabled}
                  showMissing={showMissing}
                  onIssuePhotos={onIssuePhotos}
                  photoPickerDisabled={photoPickerDisabled}
                  answer={answers.items.find((answer) => answer.itemId === item.id)}
                  onValue={(value) =>
                    edit((current) => changeDraftAnswer(current, item.id, value))
                  }
                  onDetails={(change) =>
                    edit((current) => changeDraftDetails(current, item.id, change))
                  }
                />
                {status && (
                  <div className="guest-issue-photo-status">
                    <span role="status">{status}</span>
                    <button type="button" onClick={onOpenPhotos}>사진 확인</button>
                  </div>
                )}
              </Fragment>
            );
          })}
        </section>
      ))}
      <details className="guest-flow-note">
        <summary>
          추가 메모{' '}
          <span>선택{answers.generalNote ? ' · 작성됨' : ''}</span>
        </summary>
        <label htmlFor="draft-general-note">관리자에게 전달할 내용</label>
        <textarea
          id="draft-general-note"
          rows={3}
          maxLength={4000}
          disabled={disabled}
          placeholder="함께 전달할 내용을 입력해 주세요."
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
