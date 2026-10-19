import { useId } from 'react';
import type { AdminSubmissionDetail } from '../../../../features/admin-submissions/admin-submissions.types';
import {
  changeCorrectionAnswer,
  changeCorrectionDetails,
  type SubmissionCorrectionForm,
} from '../model/submission-correction-model';
import { SubmissionCorrectionAnswer } from './SubmissionCorrectionAnswer';

export function SubmissionCorrectionFields({
  detail,
  form,
  disabled,
  onChange,
}: {
  detail: AdminSubmissionDetail;
  form: SubmissionCorrectionForm;
  disabled: boolean;
  onChange: (
    update: (current: SubmissionCorrectionForm) => SubmissionCorrectionForm,
  ) => void;
}) {
  const noteId = useId();
  const reasonId = useId();
  const reasonHintId = useId();
  return (
    <div className="submission-correction-fields">
      {detail.revision.record.template.definition.sections.map((section) => (
        <section className="submission-correction-section" key={section.id}>
          <h3>{section.title}</h3>
          {section.items.map((item) => (
            <SubmissionCorrectionAnswer
              key={item.id}
              item={item}
              answer={form.items.find((answer) => answer.itemId === item.id)}
              disabled={disabled}
              onValue={(value) =>
                onChange((current) =>
                  changeCorrectionAnswer(current, item.id, value),
                )
              }
              onDetails={(change) =>
                onChange((current) =>
                  changeCorrectionDetails(current, item.id, change),
                )
              }
            />
          ))}
        </section>
      ))}
      <div className="submission-correction-text-fields">
        <div className="submission-correction-text-field">
          <div className="submission-correction-field-heading">
            <label htmlFor={noteId}>전체 메모 <span>선택</span></label>
            <span>
              {[...form.generalNote.trim()].length.toLocaleString('ko-KR')} / 4,000자
            </span>
          </div>
          <textarea
            id={noteId}
            rows={3}
            value={form.generalNote}
            disabled={disabled}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                generalNote: event.target.value,
              }))
            }
          />
        </div>
        <div className="submission-correction-text-field">
          <div className="submission-correction-field-heading">
            <label htmlFor={reasonId}>정정 사유 <span>필수</span></label>
            <span>
              {[...form.reason.trim()].length.toLocaleString('ko-KR')} / 1,000자
            </span>
          </div>
          <textarea
            id={reasonId}
            rows={3}
            value={form.reason}
            disabled={disabled}
            aria-required="true"
            aria-describedby={reasonHintId}
            onChange={(event) =>
              onChange((current) => ({ ...current, reason: event.target.value }))
            }
          />
          <p className="submission-detail-caption" id={reasonHintId}>
            변경 이유를 입력해 주세요. 최대 1,000자입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
