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
    repairReported?: boolean;
    repairNote?: string | null;
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
          이상 있음
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
            rows={2}
            maxLength={2000}
            placeholder="확인한 이상 내용을 적어 주세요."
          />
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
          <label className="staff-draft-urgent">
            <input
              type="checkbox"
              checked={answer.repairReported}
              onChange={(event) => {
                if (
                  !event.target.checked &&
                  answer.repairNote &&
                  !window.confirm(
                    '수리 보고를 해제하면 수리 메모가 지워집니다. 해제할까요?',
                  )
                )
                  return;
                onDetails({
                  repairReported: event.target.checked,
                  ...(!event.target.checked ? { repairNote: null } : {}),
                });
              }}
            />
            현장에서 수리했어요
          </label>
          {answer.repairReported && (
            <div className="staff-flow-repair">
              <label htmlFor={`${descriptionId}-repair`}>
                수리한 내용 <span>(선택)</span>
              </label>
              <textarea
                id={`${descriptionId}-repair`}
                rows={2}
                maxLength={2000}
                value={answer.repairNote ?? ''}
                onChange={(event) =>
                  onDetails({ repairNote: event.target.value })
                }
                placeholder="어떻게 수리했는지 알려 주세요."
              />
              <p className="staff-draft-hint">
                수리 보고 후 관리자가 처리 상태를 확인합니다.
              </p>
            </div>
          )}
        </div>
      )}
    </fieldset>
  );
}
