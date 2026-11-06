import type { GuestDraftAnswer } from '../../../../features/guest-drafts/guest-drafts.types';

export function GuestSubmittedAnswer({
  answer,
  label,
}: {
  answer: GuestDraftAnswer | undefined;
  label?: string;
}) {
  let badge = 'guest-submitted-badge';
  if (answer)
    badge +=
      answer.value === 'NORMAL'
        ? ' guest-submitted-badge--normal'
        : ' guest-submitted-badge--abnormal';
  return (
    <div className="guest-submitted-answer">
      <div className="guest-submitted-answer-line">
        {label && <h4>{label}</h4>}
        <div className="guest-submitted-result">
          <span className={badge}>
            {!answer ? '미응답' : answer.value === 'NORMAL' ? '정상' : '이상'}
          </span>
          {answer?.isUrgent && (
            <strong className="guest-submitted-urgent">긴급</strong>
          )}
        </div>
      </div>
      {answer?.value === 'ABNORMAL' && (
        <p className="guest-submitted-text">
          {answer.description || '이상 내용 미입력'}
        </p>
      )}
    </div>
  );
}
