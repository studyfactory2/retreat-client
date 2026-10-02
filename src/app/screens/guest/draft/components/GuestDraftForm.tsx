import { useState } from 'react';
import type { GuestDraftAnswers } from '../../../../features/guest-drafts/guest-drafts.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { formatGuestStayTimestamp } from '../../entry/model/guest-entry-model';
import type { DraftResource } from '../hooks/use-guest-draft';
import {
  changeDraftAnswer,
  changeDraftDetails,
} from '../model/guest-draft-model';
import { DraftAnswerField } from './DraftAnswerField';
import { DraftResumeLink } from './DraftResumeLink';
import { GuestDraftPhotos } from './GuestDraftPhotos';
import { GuestSubmissionReview } from './GuestSubmissionReview';
import { GuestSubmissionUncertain } from './GuestSubmissionUncertain';
import { useGuestDraftPhotos } from '../hooks/use-guest-draft-photos';
import { assertGuestChecklistComplete } from '../../../../features/guest-submissions/guest-submissions-validation';
import type { useGuestDraft } from '../hooks/use-guest-draft';

export function GuestDraftForm({
  resource,
  token,
  dirty,
  edit,
  save,
  submit,
  reload,
  recheck,
}: {
  resource: Extract<DraftResource, { status: 'ready' }>;
  token: string;
  dirty: boolean;
  edit: (change: (answers: GuestDraftAnswers) => GuestDraftAnswers) => void;
  save: () => Promise<void>;
  submit: ReturnType<typeof useGuestDraft>['submit'];
  reload: () => void;
  recheck: () => void;
}) {
  const { draft, answers, access, mutation, message, attempt } = resource;
  const [reviewVersion, setReviewVersion] = useState<string | null>(null);
  const [reviewMessage, setReviewMessage] = useState('');
  const finalReview = reviewVersion === draft.updatedAt;
  const submitting = mutation === 'submitting';
  const unresolvedSubmission = attempt !== null;
  const photos = useGuestDraftPhotos({
    token,
    draftId: draft.id,
    locked:
      access !== 'ready' ||
      mutation === 'saving' ||
      mutation === 'conflict' ||
      mutation === 'uncertain' ||
      finalReview ||
      unresolvedSubmission,
    onAccessRejected: recheck,
  });
  const title = draft.type === 'CHECK_IN' ? '입실 체크' : '퇴실 체크';
  const saving = mutation === 'saving';
  const review = mutation === 'conflict' || mutation === 'uncertain';
  const total = draft.template.definition.sections.reduce(
    (count, section) => count + section.items.length,
    0,
  );
  const disabled =
    saving ||
    review ||
    access !== 'ready' ||
    finalReview ||
    unresolvedSubmission ||
    photos.busy;
  const photoBlocked = photos.busy || photos.blocked;
  return (
    <>
      <section className="guest-draft-intro">
        <p className="guest-draft-eyebrow">이용객 체크리스트</p>
        <h1>{title}</h1>
        <p className="guest-draft-property">
          {draft.property.region ? `${draft.property.region} · ` : ''}
          {draft.property.name}
        </p>
        <p>
          시설 상태를 확인해 주세요. 화면을 나가기 전 임시 저장하면 작성
          링크에서 이어서 작성할 수 있습니다.
        </p>
      </section>
      <section
        className="guest-draft-card guest-draft-person"
        aria-label="이용 정보"
      >
        <dl>
          <div>
            <dt>이용일</dt>
            <dd>{draft.visitDate.replaceAll('-', '.')}</dd>
          </div>
          <div>
            <dt>이름</dt>
            <dd>{draft.author.name}</dd>
          </div>
          {(draft.author.company || draft.author.department) && (
            <div>
              <dt>회사 · 부서</dt>
              <dd>
                {[draft.author.company, draft.author.department]
                  .filter(Boolean)
                  .join(' · ')}
              </dd>
            </div>
          )}
        </dl>
      </section>
      <div className="guest-draft-progress" aria-label="체크리스트 작성 현황">
        <div>
          <strong>
            {answers.items.length}
            <span> / {total} 항목</span>
          </strong>
          <span>작성한 항목</span>
        </div>
        <progress
          value={answers.items.length}
          max={total}
          aria-label="작성한 항목"
        />
        <p>
          일부 항목만 임시 저장할 수 있습니다. 최종 제출 전에는 필수 항목과 이상
          내용을 모두 확인해 주세요.
        </p>
      </div>
      {((message && !unresolvedSubmission) || access === 'checking') && (
        <section
          className={`guest-draft-notice${mutation === 'saved' && access === 'ready' ? ' guest-draft-notice--saved' : ''}`}
          role={
            mutation === 'saved' || access === 'checking' ? 'status' : 'alert'
          }
        >
          <p>
            {access === 'checking'
              ? '작성 링크와 최신 저장 상태를 확인하고 있습니다. 현재 입력은 유지됩니다.'
              : message}
          </p>
          {access === 'blocked' && (
            <Button className="guest-draft-secondary" onClick={recheck}>
              연결 다시 확인
            </Button>
          )}
          {review && !unresolvedSubmission && access !== 'checking' && (
            <Button className="guest-draft-secondary" onClick={reload}>
              서버 내용으로 다시 불러오기
            </Button>
          )}
        </section>
      )}
      <form
        className="guest-draft-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!disabled && !photoBlocked) void save();
        }}
        aria-busy={saving}
      >
        {draft.template.definition.sections.map((section, index) => (
          <section
            className="guest-draft-section"
            key={section.id}
            aria-labelledby={`draft-section-${section.id}`}
          >
            <h2 id={`draft-section-${section.id}`}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              {section.title}
            </h2>
            {section.items.map((item) => (
              <DraftAnswerField
                key={item.id}
                item={item}
                disabled={disabled}
                answer={answers.items.find(
                  (answer) => answer.itemId === item.id,
                )}
                onValue={(value) =>
                  edit((current) => changeDraftAnswer(current, item.id, value))
                }
                onDetails={(change) =>
                  edit((current) =>
                    changeDraftDetails(current, item.id, change),
                  )
                }
              />
            ))}
          </section>
        ))}
        <section className="guest-draft-card guest-draft-note">
          <label htmlFor="draft-general-note">
            추가 전달 사항 <span>선택</span>
          </label>
          <textarea
            id="draft-general-note"
            rows={4}
            maxLength={4000}
            disabled={disabled}
            placeholder="함께 전달할 내용이 있다면 남겨주세요."
            value={answers.generalNote ?? ''}
            onChange={(event) =>
              edit((current) => ({
                ...current,
                generalNote: event.target.value || null,
              }))
            }
          />
        </section>
        <div className="guest-draft-save">
          <p role="status">
            {saving
              ? '저장하고 있습니다…'
              : dirty
                ? '아직 저장하지 않은 변경 사항이 있습니다.'
                : `최근 저장: ${formatGuestStayTimestamp(draft.updatedAt)} · 한국 시간`}
          </p>
          <Button
            type="submit"
            loading={saving}
            disabled={!dirty || disabled || photoBlocked}
          >
            임시 저장
          </Button>
          <p>임시 저장한 내용은 최종 제출된 기록으로 처리되지 않습니다.</p>
        </div>
      </form>
      <GuestDraftPhotos controller={photos} />
      {unresolvedSubmission ? (
        mutation === 'submission-uncertain' ? (
          <GuestSubmissionUncertain
            message={message}
            checking={access === 'checking'}
            onCheck={recheck}
            canRetry={access === 'ready'}
            onRetry={() => {
              if (access === 'ready')
                void submit(attempt.photos, attempt.draft.updatedAt);
            }}
          />
        ) : (
          <section
            className="guest-draft-card guest-submission-pending"
            role="status"
          >
            <h2>체크리스트를 제출하고 있습니다</h2>
            <p>제출 결과를 확인할 때까지 이 화면을 유지해 주세요.</p>
          </section>
        )
      ) : finalReview ? (
        <GuestSubmissionReview
          key={`${draft.updatedAt}:${photos.items.map((photo) => photo.id).join(':')}`}
          draft={draft}
          photos={photos.items}
          disabled={access !== 'ready' || photoBlocked || review || dirty}
          submitting={submitting}
          onCancel={() => {
            setReviewVersion(null);
            setReviewMessage('');
          }}
          onSubmit={(assignments) => {
            void submit(assignments, reviewVersion, photos.refresh);
          }}
        />
      ) : (
        <section className="guest-draft-card guest-submission-next">
          <h2>마지막으로 한 번 더 확인해 주세요</h2>
          <p>
            저장한 답변과 사진을 검토한 뒤 최종 제출합니다. 사진은 선택
            사항입니다.
          </p>
          {dirty && <p>먼저 변경 내용을 임시 저장해 주세요.</p>}
          {photoBlocked && (
            <p>사진 작업을 마치고 목록을 확인하면 검토할 수 있습니다.</p>
          )}
          {reviewVersion && reviewVersion !== draft.updatedAt && (
            <p role="alert">
              저장 내용이 변경되었습니다. 최신 답변을 다시 검토해 주세요.
            </p>
          )}
          {reviewMessage && <p role="alert">{reviewMessage}</p>}
          <Button
            disabled={dirty || disabled || photoBlocked}
            onClick={() => {
              try {
                assertGuestChecklistComplete(draft);
                setReviewMessage('');
                setReviewVersion(draft.updatedAt);
              } catch (error: unknown) {
                setReviewMessage(
                  error instanceof Error
                    ? error.message
                    : '필수 답변과 이상 설명을 확인해 주세요.',
                );
              }
            }}
          >
            제출 전 검토
          </Button>
        </section>
      )}
      <DraftResumeLink
        token={token}
        expiresAt={draft.expiresAt}
        disabled={saving || unresolvedSubmission || access !== 'ready'}
      />
      <button
        type="button"
        className="guest-draft-reload"
        disabled={
          saving ||
          unresolvedSubmission ||
          finalReview ||
          photos.busy ||
          access === 'checking'
        }
        onClick={reload}
      >
        서버 저장 내용 다시 불러오기
      </button>
    </>
  );
}
