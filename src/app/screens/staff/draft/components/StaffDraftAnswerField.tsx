import type { StaffDraftAnswer } from '../../../../features/staff-drafts/staff-drafts.types';
import type { StaffChecklistDefinition } from '../../../../features/staff-entry/staff-entry.types';

type ChecklistItem =
  StaffChecklistDefinition['sections'][number]['items'][number];
export function StaffDraftAnswerField({
  item,
  answer,
  disabled,
  onValue,
  onDetails,
}: {
  item: ChecklistItem;
  answer?: StaffDraftAnswer;
  disabled: boolean;
  onValue: (value: 'NORMAL' | 'ABNORMAL' | null) => void;
  onDetails: (change: {
    description?: string | null;
    isUrgent?: boolean;
  }) => void;
}) {
  const descriptionId = `staff-description-${item.id}`;
  return (
    <fieldset className="staff-draft-item" disabled={disabled}>
      <legend>
        {item.label}
        {item.required && (
          <span className="staff-draft-required">필수 항목</span>
        )}
      </legend>
      <div
        className="staff-draft-choices"
        role="group"
        aria-label={`${item.label} 상태`}
      >
        <button
          type="button"
          aria-pressed={answer?.value === 'NORMAL'}
          onClick={() => onValue('NORMAL')}
        >
          정상
        </button>
        <button
          type="button"
          className="staff-draft-choice-abnormal"
          aria-pressed={answer?.value === 'ABNORMAL'}
          onClick={() => onValue('ABNORMAL')}
        >
          이상
        </button>
        {answer && (
          <button
            type="button"
            className="staff-draft-clear"
            onClick={() => onValue(null)}
          >
            선택 해제
          </button>
        )}
      </div>
      {answer?.value === 'ABNORMAL' && (
        <div className="staff-draft-abnormal">
          <label htmlFor={descriptionId}>
            이상 내용 <span>(선택)</span>
          </label>
          <textarea
            id={descriptionId}
            value={answer.description ?? ''}
            onChange={(event) => onDetails({ description: event.target.value })}
            rows={3}
            placeholder="확인한 이상 내용을 적어 주세요."
          />
          <p className="staff-draft-hint">
            최대 2,000자 · 임시 저장은 설명 없이도 가능합니다.
          </p>
          <label className="staff-draft-urgent">
            <input
              type="checkbox"
              checked={answer.isUrgent}
              onChange={(event) =>
                onDetails({ isUrgent: event.target.checked })
              }
            />
            긴급 확인이 필요합니다
          </label>
          {(answer.repairReported || answer.repairNote !== null) && (
            <p className="staff-draft-preserved">
              기존 수리 보고 정보가 함께 보존됩니다. 정상으로 바꾸거나 선택을
              해제하면 확인 후 해당 정보도 삭제됩니다.
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
}
