import { useState } from 'react';
import type { GuestDraftAnswers } from '../../../../features/guest-drafts/guest-drafts.types';
import type { GuestSubmissionDetailDto } from '../../../../features/guest-submission-details/guest-submission-details.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { GuestSubmittedAnswer } from './GuestSubmittedAnswer';

export function GuestSubmissionReview({
  detail,
  answers,
  reason,
  disabled,
  pending,
  saving,
  onBack,
  onSave,
}: {
  detail: GuestSubmissionDetailDto;
  answers: GuestDraftAnswers;
  reason: string;
  disabled: boolean;
  pending: boolean;
  saving: boolean;
  onBack: () => void;
  onSave: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const changes = detail.template.definition.sections
    .flatMap((section) =>
      section.items.map((item) => {
        const before = detail.answers.items.find(
          (answer) => answer.itemId === item.id,
        );
        const rawAfter = answers.items.find(
          (answer) => answer.itemId === item.id,
        );
        const after = rawAfter && {
          ...rawAfter,
          description: rawAfter.description?.trim() || null,
        };
        const changed =
          before?.value !== after?.value ||
          before?.description !== after?.description ||
          before?.isUrgent !== after?.isUrgent;
        return { item, section: section.title, before, after, changed };
      }),
    )
    .filter((item) => item.changed);
  const dropped = detail.photos.filter(
    (photo) =>
      !answers.items.some(
        (answer) =>
          answer.itemId === photo.itemId && answer.value === 'ABNORMAL',
      ),
  );
  const note = answers.generalNote?.trim() || null;
  return (
    <section
      className="guest-draft-card guest-submitted-review"
      aria-labelledby="correction-review-title"
    >
      <p className="guest-draft-eyebrow">저장 전 마지막 확인</p>
      <h2 id="correction-review-title">수정 내용을 확인해 주세요</h2>
      <p className="guest-submitted-hint">
        {detail.revision}차 제출 내용을 기준으로 수정합니다.
      </p>
      {changes.map(({ item, section, before, after }) => (
        <article className="guest-submitted-change" key={item.id}>
          <h3>
            <small>{section}</small>
            {item.label}
          </h3>
          <div className="guest-submitted-compare">
            <div>
              <h4>수정 전</h4>
              <GuestSubmittedAnswer answer={before} />
            </div>
            <div>
              <h4>수정 후</h4>
              <GuestSubmittedAnswer answer={after} />
            </div>
          </div>
        </article>
      ))}
      {note !== detail.answers.generalNote && (
        <article className="guest-submitted-change">
          <h3>전체 메모</h3>
          <div className="guest-submitted-compare">
            <div>
              <h4>수정 전</h4>
              <p className="guest-submitted-text">
                {detail.answers.generalNote || '메모 없음'}
              </p>
            </div>
            <div>
              <h4>수정 후</h4>
              <p className="guest-submitted-text">{note || '메모 없음'}</p>
            </div>
          </div>
        </article>
      )}
      {reason.trim() && (
        <div className="guest-submitted-change">
          <h3>수정 사유</h3>
          <p className="guest-submitted-text">{reason.trim()}</p>
        </div>
      )}
      <aside className="guest-submitted-notice">
        {dropped.length > 0 && (
          <p>
            <strong>현재 첨부에서 사진 {dropped.length}장이 제외됩니다.</strong>{' '}
            과거 기록의 사진은 유지되며, 다시 이상으로 바꿔도 자동 복구되지
            않습니다.
          </p>
        )}
        <p>
          이전에 접수한 이상사항의 처리 상태는 바뀌지 않습니다. 관리자가 확인한
          해결·취소 상태를 이 수정으로 변경할 수 없습니다.
        </p>
      </aside>
      {!pending && (
        <>
          <label className="guest-submitted-confirm">
            <input
              type="checkbox"
              checked={confirmed}
              disabled={disabled}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            <span>수정 내용과 사진 처리 안내를 확인했습니다.</span>
          </label>
          <div className="guest-submitted-actions">
            <Button
              className="guest-draft-secondary"
              disabled={disabled}
              onClick={onBack}
            >
              계속 수정
            </Button>
            <Button
              disabled={disabled || !confirmed}
              loading={saving}
              onClick={onSave}
            >
              수정 내용 저장
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
