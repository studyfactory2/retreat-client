import { useEffect, useId, useRef, useState } from 'react';
import type { GuestDraftDto } from '../../../../features/guest-drafts/guest-drafts.types';
import type { GuestDraftPhotoDto } from '../../../../features/guest-draft-photos/guest-draft-photos.types';
import type { GuestSubmissionPhotoInput } from '../../../../features/guest-submissions/guest-submissions.types';
import { Button } from '../../../../shared/ui/Button/Button';

export function GuestSubmissionReview({
  draft,
  photos,
  disabled,
  submitting,
  onSubmit,
  onCancel,
}: {
  draft: GuestDraftDto;
  photos: GuestDraftPhotoDto[];
  disabled: boolean;
  submitting: boolean;
  onSubmit: (assignments: GuestSubmissionPhotoInput[]) => void;
  onCancel: () => void;
}) {
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const labelId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  const items = draft.template.definition.sections.flatMap((section) =>
    section.items.map((item) => ({ ...item, section: section.title })),
  );
  const abnormal = items.filter((item) =>
    draft.answers.items.some(
      (answer) => answer.itemId === item.id && answer.value === 'ABNORMAL',
    ),
  );
  const allMapped = photos.every((photo) =>
    abnormal.some((item) => item.id === assignments[photo.id]),
  );
  const title = draft.type === 'CHECK_IN' ? '입실 체크' : '퇴실 체크';
  return (
    <section
      className="guest-draft-card guest-submission-review"
      aria-labelledby={labelId}
    >
      <p className="guest-draft-eyebrow">마지막 확인</p>
      <h2 id={labelId} ref={heading} tabIndex={-1}>
        제출 내용을 확인해 주세요
      </h2>
      <p>
        저장된 답변 {draft.answers.items.length}개 · 이상 항목 {abnormal.length}
        개 · 사진 {photos.length}장
      </p>
      <ul className="guest-submission-answers">
        {items.map((item) => {
          const answer = draft.answers.items.find(
            (entry) => entry.itemId === item.id,
          );
          return (
            <li key={item.id}>
              <div>
                <span>{item.section}</span>
                <strong>{item.label}</strong>
                <em
                  className={answer?.value === 'ABNORMAL' ? 'is-abnormal' : ''}
                >
                  {answer?.value === 'ABNORMAL'
                    ? '이상'
                    : answer
                      ? '정상'
                      : '미응답 · 선택'}
                </em>
              </div>
              {answer?.value === 'ABNORMAL' && (
                <p>
                  {answer.description}
                  {answer.isUrgent && <b> · 긴급</b>}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      {draft.answers.generalNote && (
        <div className="guest-submission-note">
          <strong>추가 전달 사항</strong>
          <p>{draft.answers.generalNote}</p>
        </div>
      )}
      {photos.length > 0 && (
        <div className="guest-submission-mappings">
          <h3>사진의 이상 항목을 선택해 주세요</h3>
          <p>
            각 사진은 이상으로 표시한 항목 한 곳에 연결됩니다. 연결 정보는 최종
            제출할 때 저장되며, 검토를 나가거나 새로 열면 다시 선택해야 합니다.
          </p>
          {abnormal.length === 0 && (
            <p role="alert">
              이상으로 표시된 항목이 없습니다. 작성 화면으로 돌아가 사진을
              삭제하거나 해당 항목의 상태를 확인해 주세요.
            </p>
          )}
          {photos.map((photo, index) => (
            <div className="guest-submission-mapping" key={photo.id}>
              <span>
                사진 {index + 1} · {photo.filename}
              </span>
              <label htmlFor={`${labelId}-${photo.id}`}>연결할 이상 항목</label>
              <select
                id={`${labelId}-${photo.id}`}
                value={assignments[photo.id] ?? ''}
                disabled={disabled || submitting}
                onChange={(event) => {
                  setConfirmed(false);
                  setAssignments((previous) => ({
                    ...previous,
                    [photo.id]: event.target.value,
                  }));
                }}
              >
                <option value="">항목 선택</option>
                {abnormal.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.section} · {item.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
      <label className="guest-submission-confirm">
        <input
          type="checkbox"
          checked={confirmed}
          disabled={disabled || submitting || !allMapped}
          onChange={(event) => setConfirmed(event.target.checked)}
        />
        <span>답변과 사진을 확인했습니다. 이 내용으로 제출합니다.</span>
      </label>
      <div className="guest-submission-actions">
        <Button
          className="guest-draft-secondary"
          disabled={submitting}
          onClick={onCancel}
        >
          작성으로 돌아가기
        </Button>
        <Button
          loading={submitting}
          disabled={disabled || !allMapped || !confirmed}
          onClick={() => {
            if (!allMapped || !confirmed || disabled || submitting) return;
            onSubmit(
              photos.map((photo) => ({
                attachmentId: photo.id,
                purpose: 'DEFECT',
                itemId: assignments[photo.id],
              })),
            );
          }}
        >
          {title} 제출
        </Button>
      </div>
    </section>
  );
}
