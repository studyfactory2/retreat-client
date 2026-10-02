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
    <div>
      <aside className="guest-submitted-notice">
        <p>
          답변과 메모를 수정할 수 있습니다. 사진 추가·교체·직접 삭제는 지원하지
          않습니다.
        </p>
        <p>
          이상 항목을 정상으로 바꾸거나 선택 해제하면 해당 사진은 현재 제출
          내용에서 제외됩니다. 과거 기록은 보관되며, 다시 이상으로 바꿔도 사진은
          자동으로 돌아오지 않습니다.
        </p>
      </aside>
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
          rows={4}
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
          rows={3}
          maxLength={1000}
          disabled={disabled}
          value={reason}
          placeholder="수정한 이유를 남겨 주세요."
          onChange={(event) => setReason(event.target.value)}
        />
        <p className="guest-submitted-hint">
          수정 사유만으로는 저장되지 않습니다. 저장 전에 변경 내용을 한 번 더
          확인합니다. 화면을 떠나면 저장하지 않은 입력이 사라질 수 있습니다.
        </p>
      </section>
    </div>
  );
}
