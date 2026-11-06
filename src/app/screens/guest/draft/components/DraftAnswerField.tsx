import type { GuestDraftAnswer } from '../../../../features/guest-drafts/guest-drafts.types';
import { GuestPhotoPicker } from './GuestPhotoPicker';

export function DraftAnswerField({
  item,
  answer,
  disabled,
  onValue,
  onDetails,
  onIssuePhotos,
  photoPickerDisabled = false,
}: {
  onIssuePhotos?: (files: FileList, itemId: string) => void;
  photoPickerDisabled?: boolean;
  item: { id: string; label: string; required: boolean };
  answer: GuestDraftAnswer | undefined;
  disabled: boolean;
  onValue: (value: GuestDraftAnswer['value'] | null) => void;
  onDetails: (change: {
    description?: string | null;
    isUrgent?: boolean;
  }) => void;
}) {
  return (
    <fieldset
      className="guest-check-item"
      disabled={disabled}
    >
      <legend className="guest-check-item__legend">{item.label}</legend>
      <div className="guest-check-item__heading">
        <p>
          {item.label}
          {item.required && <span className="guest-draft-required">필수</span>}
        </p>
        {answer && (
          <button
            type="button"
            className="guest-check-clear"
            onClick={() => onValue(null)}
          >
            선택 해제
          </button>
        )}
      </div>
      <div className="guest-check-choices" role="group" aria-label={`${item.label} 상태`}>
        <button
          type="button"
          aria-pressed={answer?.value === 'NORMAL'}
          onClick={() => onValue('NORMAL')}
        >
          정상
        </button>
        <button
          type="button"
          className="guest-check-choices__abnormal"
          aria-pressed={answer?.value === 'ABNORMAL'}
          onClick={() => onValue('ABNORMAL')}
        >
          이상 있음
        </button>
      </div>
      {answer?.value === 'ABNORMAL' && (
        <div className="guest-draft-item__details">
          <label htmlFor={`draft-description-${item.id}`}>이상 내용</label>
          <textarea
            id={`draft-description-${item.id}`}
            rows={3}
            maxLength={2000}
            value={answer.description ?? ''}
            placeholder="어떤 문제가 있는지 알려주세요."
            onChange={(event) =>
              onDetails({ description: event.target.value || null })
            }
          />
          <label className="guest-draft-urgent">
            <input
              type="checkbox"
              checked={answer.isUrgent}
              onChange={(event) =>
                onDetails({ isUrgent: event.target.checked })
              }
            />
            <span>긴급한 문제예요</span>
          </label>
          {onIssuePhotos && (
            <GuestPhotoPicker
              label="이 항목의 이상 사진 추가"
              disabled={disabled || photoPickerDisabled}
              onPick={(files) => onIssuePhotos(files, item.id)}
            />
          )}
        </div>
      )}
    </fieldset>
  );
}
