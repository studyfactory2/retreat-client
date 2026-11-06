import type { GuestDraftAnswers } from '../../../../features/guest-drafts/guest-drafts.types';
import type { GuestSubmissionDetailDto } from '../../../../features/guest-submission-details/guest-submission-details.types';
import { DraftAnswerField } from '../../draft/components/DraftAnswerField';
import {
  changeDraftAnswer,
  changeDraftDetails,
} from '../../draft/model/guest-draft-model';

export function GuestSubmissionEditor({
  detail,
  answers,
  reason,
  disabled,
  edit,
  setReason,
}: {
  detail: GuestSubmissionDetailDto;
  answers: GuestDraftAnswers;
  reason: string;
  disabled: boolean;
  edit: (change: (answers: GuestDraftAnswers) => GuestDraftAnswers) => void;
  setReason: (value: string) => void;
}) {
  return (
    <div className="guest-correction-editor">
      <details className="guest-record-card guest-record-disclosure guest-correction-help">
        <summary>수정할 수 있는 내용</summary>
        <p>
          답변과 메모를 수정할 수 있어요. 제출한 사진은 새로 추가하거나 교체할
          수 없어요.
        </p>
        <p>
          이상 답변을 정상으로 바꾸거나 선택을 해제하면 연결한 사진은 이전
          기록에만 보관돼요. 다시 이상으로 바꿔도 사진은 자동으로 돌아오지
          않아요.
        </p>
      </details>
      {detail.template.definition.sections.map((section) => (
        <section className="guest-draft-card" key={section.id}>
          <h2>{section.title}</h2>
          {section.items.map((item) => (
            <DraftAnswerField
              key={item.id}
              item={item}
              answer={answers.items.find((answer) => answer.itemId === item.id)}
              disabled={disabled}
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
      <section className="guest-draft-card guest-draft-note">
        <label htmlFor="correction-note">전체 메모 · 선택</label>
        <textarea
          id="correction-note"
          rows={3}
          maxLength={4000}
          disabled={disabled}
          value={answers.generalNote ?? ''}
          onChange={(event) =>
            edit((current) => ({
              ...current,
              generalNote: event.target.value || null,
            }))
          }
        />
        <label htmlFor="correction-reason">수정 사유 · 선택</label>
        <textarea
          id="correction-reason"
          rows={2}
          maxLength={1000}
          disabled={disabled}
          value={reason}
          placeholder="수정한 이유를 남겨 주세요."
          onChange={(event) => setReason(event.target.value)}
        />
        <p className="guest-submitted-hint">
          답변이나 메모를 바꾼 뒤 변경 내용을 검토해 주세요.
        </p>
      </section>
    </div>
  );
}
