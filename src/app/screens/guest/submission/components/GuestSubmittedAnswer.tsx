import type { GuestDraftAnswer } from '../../../../features/guest-drafts/guest-drafts.types';

export function GuestSubmittedAnswer({
  answer,
}: {
  answer: GuestDraftAnswer | undefined;
}) {
  return (
    <div className="guest-submitted-answer">
      <span
        className={`guest-submitted-badge${answer?.value === 'ABNORMAL' ? ' guest-submitted-badge--abnormal' : ''}`}
      >
        {!answer ? '미응답' : answer.value === 'NORMAL' ? '정상' : '이상'}
      </span>
      {answer?.isUrgent && (
        <strong className="guest-submitted-urgent">긴급</strong>
      )}
      {answer?.value === 'ABNORMAL' && (
        <p className="guest-submitted-text">
          {answer.description || '이상 내용 미입력'}
        </p>
      )}
    </div>
  );
}
