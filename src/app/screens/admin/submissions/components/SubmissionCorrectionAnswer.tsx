import { useId } from 'react';
import type { AdminSubmissionChecklistItem } from '../../../../features/admin-submissions/admin-submissions.types';
import type { CorrectionAnswer } from '../model/submission-correction-model';

export function SubmissionCorrectionAnswer({
  item,
  answer,
  disabled,
  onValue,
  onDetails,
}: {
  item: AdminSubmissionChecklistItem;
  answer?: CorrectionAnswer;
  disabled: boolean;
  onValue: (value: CorrectionAnswer['value'] | null) => void;
  onDetails: (
    change: Partial<Pick<CorrectionAnswer, 'description' | 'isUrgent'>>,
  ) => void;
}) {
  const descriptionId = useId();
  const hintId = useId();
  return (
    <fieldset
      className={`submission-correction-item${answer?.value === 'ABNORMAL' ? ' is-abnormal' : ''}`}
      disabled={disabled}
    >
      <legend>
        {item.label} <span>{item.required ? '필수' : '선택'}</span>
      </legend>
      <div
        className="submission-correction-choices"
        aria-label={`${item.label} 답변`}
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
          aria-pressed={answer?.value === 'ABNORMAL'}
          onClick={() => onValue('ABNORMAL')}
        >
          이상
        </button>
        {!item.required && (
          <button
            type="button"
            disabled={!answer}
            onClick={() => onValue(null)}
          >
            선택 해제
          </button>
        )}
      </div>
      {answer?.value === 'ABNORMAL' && (
        <div className="submission-correction-answer-details">
          <label htmlFor={descriptionId}>이상 내용 · 선택</label>
          <textarea
            id={descriptionId}
            value={answer.description ?? ''}
            rows={3}
            aria-describedby={hintId}
            onChange={(event) =>
              onDetails({ description: event.target.value || null })
            }
          />
          <p className="submission-detail-caption" id={hintId}>
            최대 2000자 ·{' '}
            {[...(answer.description ?? '').trim()].length.toLocaleString(
              'ko-KR',
            )}
            자
          </p>
          <label className="submission-correction-check">
            <input
              type="checkbox"
              checked={answer.isUrgent}
              onChange={(event) =>
                onDetails({ isUrgent: event.target.checked })
              }
            />
            <span>답변에 긴급 표시</span>
          </label>
        </div>
      )}
    </fieldset>
  );
}
