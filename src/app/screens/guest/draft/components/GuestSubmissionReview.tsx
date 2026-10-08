import { useId, useState } from 'react';
import type { GuestDraftDto } from '../../../../features/guest-drafts/guest-drafts.types';
import type { GuestDraftPhotoDto } from '../../../../features/guest-draft-photos/guest-draft-photos.types';
import type { GuestSubmissionPhotoInput } from '../../../../features/guest-submissions/guest-submissions.types';
import { Button } from '../../../../shared/ui/Button/Button';
import '../styles/guest-submission-review.css';

type ReviewConfirmation = {
  draft: GuestDraftDto;
  photos: GuestDraftPhotoDto[];
  assignments: GuestSubmissionPhotoInput[];
};

export function GuestSubmissionReview({
  draft,
  photos,
  assignments,
  disabled,
  submitting,
  onSubmit,
  onCancel,
  backDisabled = false,
}: {
  draft: GuestDraftDto;
  photos: GuestDraftPhotoDto[];
  assignments: GuestSubmissionPhotoInput[];
  disabled: boolean;
  submitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  backDisabled?: boolean;
}) {
  const [confirmation, setConfirmation] = useState<ReviewConfirmation | null>(
    null,
  );
  const labelId = useId();
  const confirmed =
    confirmation?.draft === draft &&
    confirmation.photos === photos &&
    confirmation.assignments === assignments;
  const items = draft.template.definition.sections.flatMap((section) =>
    section.items.map((item) => ({ ...item, section: section.title })),
  );
  const abnormal = items.filter((item) =>
    draft.answers.items.some(
      (answer) =>
        answer.itemId.toLowerCase() === item.id.toLowerCase() &&
        answer.value === 'ABNORMAL',
    ),
  );
  const allMapped =
    photos.length === assignments.length &&
    photos.every(
      (photo) =>
        assignments.filter(
          (assignment) =>
            assignment.attachmentId.toLowerCase() === photo.id.toLowerCase() &&
            assignment.purpose === 'DEFECT' &&
            abnormal.some(
              (item) =>
                item.id.toLowerCase() === assignment.itemId.toLowerCase(),
            ),
        ).length === 1,
    );
  const title = draft.type === 'CHECK_IN' ? '입실 체크' : '퇴실 체크';
  return (
    <section
      className="guest-draft-card guest-saved-review"
      aria-labelledby={labelId}
    >
      <h2 id={labelId}>이 내용으로 제출할까요?</h2>
      <p className="guest-saved-review__intro">
        저장된 답변과 첨부 사진을 확인해 주세요. 아직 제출 전이에요.
      </p>
      <dl className="guest-saved-review__counts">
        <div>
          <dt>답변</dt>
          <dd>{draft.answers.items.length}개</dd>
        </div>
        <div>
          <dt>이상 항목</dt>
          <dd>{abnormal.length}개</dd>
        </div>
        <div>
          <dt>사진</dt>
          <dd>{photos.length}장</dd>
        </div>
      </dl>
      {draft.template.definition.sections.map((section) => (
        <section key={section.id} className="guest-saved-review__section">
          <h3>{section.title}</h3>
          <ul>
            {section.items.map((item) => {
              const answer = draft.answers.items.find(
                (entry) => entry.itemId.toLowerCase() === item.id.toLowerCase(),
              );
              return (
                <li key={item.id}>
                  <div>
                    <span>{item.label}</span>
                    <strong
                      className={
                        answer?.value === 'ABNORMAL' ? 'is-abnormal' : ''
                      }
                    >
                      {answer?.value === 'ABNORMAL'
                        ? '이상'
                        : answer
                          ? '정상'
                          : item.required
                            ? '미응답 · 필수'
                            : '미응답 · 선택'}
                    </strong>
                  </div>
                  {answer?.description && <p>{answer.description}</p>}
                  {answer?.isUrgent && (
                    <p className="is-abnormal">긴급한 문제예요</p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {draft.answers.generalNote && (
        <div className="guest-saved-review__note">
          <h3>추가 전달 사항</h3>
          <p>{draft.answers.generalNote}</p>
        </div>
      )}
      {photos.length > 0 && (
        <details className="guest-saved-review__photos" open>
          <summary>제출할 사진 {photos.length}장과 연결 항목</summary>
          <p>아래 연결 정보는 최종 제출할 때 저장돼요.</p>
          <ol>
            {photos.map((photo, index) => {
              const assignment = assignments.find(
                (entry) =>
                  entry.attachmentId.toLowerCase() === photo.id.toLowerCase(),
              );
              const item = abnormal.find(
                (entry) =>
                  entry.id.toLowerCase() === assignment?.itemId.toLowerCase(),
              );
              return (
                <li key={photo.id}>
                  <strong>사진 {index + 1}</strong>
                  <span>{photo.filename}</span>
                  <p>
                    {item
                      ? `${item.section} · ${item.label}`
                      : '이상 항목 연결을 다시 확인해 주세요.'}
                  </p>
                </li>
              );
            })}
          </ol>
        </details>
      )}
      {!allMapped && (
        <p className="guest-saved-review__warning" role="alert">
          사진 연결을 확인할 수 없어요. 사진 단계로 돌아가 다시 확인해 주세요.
        </p>
      )}
      <label className="guest-saved-review__confirm">
        <input
          type="checkbox"
          checked={confirmed}
          disabled={disabled || submitting || !allMapped}
          onChange={(event) =>
            setConfirmation(
              event.target.checked ? { draft, photos, assignments } : null,
            )
          }
        />
        <span>답변과 사진을 확인했어요. 이 내용으로 제출합니다.</span>
      </label>
      <div className="guest-saved-review__actions">
        <Button
          className="guest-draft-secondary"
          disabled={submitting || backDisabled}
          onClick={onCancel}
        >
          이전: 사진
        </Button>
        <Button
          loading={submitting}
          disabled={disabled || !allMapped || !confirmed}
          onClick={() => {
            if (!allMapped || !confirmed || disabled || submitting) return;
            onSubmit();
          }}
        >
          {title} 제출
        </Button>
      </div>
    </section>
  );
}
