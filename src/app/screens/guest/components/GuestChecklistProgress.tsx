import type { Ref } from 'react';
import '../styles/guest-checklist-progress.css';

const labels = ['이용 정보', '시설 확인', '사진', '제출 확인'] as const;

export function GuestChecklistProgress({
  step,
  headingRef,
}: {
  step: number;
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  return (
    <div className="guest-checklist-progress">
      <div>
        <h2 ref={headingRef} tabIndex={-1}>
          {labels[step - 1]}
          <span className="guest-checklist-progress__sr"> · 전체 4단계 중 {step}단계</span>
        </h2>
        <span aria-hidden="true">{step} / {labels.length}</span>
      </div>
      <ol aria-label="체크리스트 진행 단계">
        {labels.map((label, index) => (
          <li
            key={label}
            className={index < step ? 'is-reached' : undefined}
            aria-current={index + 1 === step ? 'step' : undefined}
          >
            <span className="guest-checklist-progress__sr">{label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
