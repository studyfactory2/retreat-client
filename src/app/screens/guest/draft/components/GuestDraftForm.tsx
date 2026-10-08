import { Button } from '../../../../shared/ui/Button/Button';
import type { DraftResource } from '../hooks/use-guest-draft';
import {
  useGuestWorkflow,
  type GuestDraftSession,
} from '../hooks/use-guest-workflow';
import { guestFlowSteps } from '../model/guest-flow-model';
import { GuestChecklistStep } from './GuestChecklistStep';
import { DraftResumeLink } from './DraftResumeLink';
import { GuestDraftPhotos } from './GuestDraftPhotos';
import { GuestPhotoAssignment } from './GuestPhotoAssignment';
import { GuestSubmissionReview } from './GuestSubmissionReview';
import { GuestSubmissionUncertain } from './GuestSubmissionUncertain';

export function GuestDraftForm({
  session,
  resource,
  token,
}: {
  session: GuestDraftSession;
  resource: Extract<DraftResource, { status: 'ready' }>;
  token: string;
}) {
  const { draft, answers, access, mutation, message, attempt } = resource;
  const {
    disabled,
    photoWork,
    step,
    heading,
    later,
    message: workflowMessage,
    answered,
    required,
    photos,
    editableDraft,
    assignments,
    assign,
    resume,
    review,
    reviewCurrent,
    submit,
    back,
    saveLabel,
    preparing,
    advance,
    continueLater,
  } = useGuestWorkflow(session, resource, token);
  const title = draft.type === 'CHECK_IN' ? '입실 체크' : '퇴실 체크';
  const unresolvedSave = mutation === 'conflict' || mutation === 'uncertain';
  const locked = disabled || photoWork;
  return (
    <div className="guest-flow">
      <header className="guest-flow-intro">
        <p className="guest-draft-eyebrow">
          {draft.property.region || '휴양소'} · {title}
        </p>
        <h1>{draft.property.name}</h1>
        <p>
          {draft.author.name} <span aria-hidden="true">·</span>{' '}
          {draft.visitDate.replaceAll('-', '.')}
        </p>
        <details className="guest-flow-identity">
          <summary>이용 정보</summary>
          <dl>
            <div>
              <dt>이름</dt>
              <dd>{draft.author.name}</dd>
            </div>
            <div>
              <dt>이용일</dt>
              <dd>{draft.visitDate.replaceAll('-', '.')}</dd>
            </div>
            {draft.author.company && (
              <div>
                <dt>회사</dt>
                <dd>{draft.author.company}</dd>
              </div>
            )}
            {draft.author.department && (
              <div>
                <dt>부서</dt>
                <dd>{draft.author.department}</dd>
              </div>
            )}
            {draft.author.phone && (
              <div>
                <dt>연락처</dt>
                <dd>{draft.author.phone}</dd>
              </div>
            )}
            <div>
              <dt>체크리스트</dt>
              <dd>
                {draft.template.title} · 버전 {draft.template.version}
              </dd>
            </div>
          </dl>
        </details>
      </header>
      <ol className="guest-flow-steps" aria-label="체크리스트 진행 단계">
        <li className="is-complete">
          <span aria-hidden="true">✓</span>이용 정보
        </li>
        {guestFlowSteps.map((label, index) => (
          <li
            key={label}
            className={step > index ? 'is-complete' : ''}
            aria-current={step === index ? 'step' : undefined}
          >
            <span aria-hidden="true">{step > index ? '✓' : index + 2}</span>
            {label}
          </li>
        ))}
      </ol>
      {((message && !attempt) || access === 'checking') && (
        <section
          className={`guest-draft-notice${mutation === 'saved' && access === 'ready' ? ' guest-draft-notice--saved' : ''}`}
          role={
            mutation === 'saved' || access === 'checking' ? 'status' : 'alert'
          }
        >
          <p>
            {access === 'checking'
              ? '작성 링크와 저장 상태를 확인하고 있습니다. 현재 입력은 유지됩니다.'
              : message}
          </p>
          {access === 'blocked' && (
            <Button className="guest-draft-secondary" onClick={session.recheck}>
              연결 다시 확인
            </Button>
          )}
          {unresolvedSave && !attempt && access !== 'checking' && (
            <Button
              className="guest-draft-secondary"
              disabled={photoWork}
              onClick={session.reload}
            >
              서버 내용으로 다시 불러오기
            </Button>
          )}
        </section>
      )}
      <h2 className="guest-flow-heading" ref={heading} tabIndex={-1}>
        {attempt
          ? '제출 결과 확인'
          : later
            ? '저장했습니다. 나중에 이어서 작성하세요'
            : step === 0
              ? '시설 상태를 확인해 주세요'
              : step === 1
                ? '사진은 필요할 때만 남겨주세요'
                : '제출 확인'}
      </h2>
      {workflowMessage && (
        <p className="guest-draft-notice" role="alert">
          {workflowMessage}
        </p>
      )}
      <div hidden={step !== 0 || later || attempt !== null}>
        <div className="guest-flow-progress">
          <span>
            필수 항목{' '}
            <strong>
              {answered} / {required}
            </strong>
          </span>
          <progress
            value={answered}
            max={Math.max(required, 1)}
            aria-label="작성한 필수 항목"
          />
        </div>
        <GuestChecklistStep
          draft={draft}
          answers={answers}
          disabled={locked || step !== 0 || later}
          edit={session.edit}
        />
      </div>
      {/* Keep the gallery and its private previews mounted through every stage. */}
      <div hidden={step !== 1 || later || attempt !== null}>
        <GuestDraftPhotos
          controller={photos}
          renderAssignment={(photo, index) => (
            <GuestPhotoAssignment
              photo={photo}
              index={index}
              draft={editableDraft}
              value={assignments[photo.id] ?? ''}
              disabled={locked || step !== 1 || later}
              onChange={(value) => assign(photo.id, value)}
            />
          )}
        />
      </div>
      {attempt ? (
        mutation === 'submission-uncertain' ? (
          <GuestSubmissionUncertain
            message={message}
            checking={access === 'checking'}
            onCheck={session.recheck}
            canRetry={access === 'ready'}
            onRetry={() => {
              void session.submit(attempt.photos, attempt.draft.updatedAt);
            }}
          />
        ) : (
          <section
            className="guest-draft-card guest-submission-pending"
            role="status"
          >
            <h3>제출 결과를 확인하고 있습니다</h3>
            <p>확인이 끝날 때까지 잠시 기다려 주세요.</p>
          </section>
        )
      ) : later ? (
        <section className="guest-flow-later">
          <p>
            아직 최종 제출되지 않았습니다. 아래 링크를 보관하면 저장한 답변과
            업로드한 사진을 다시 열 수 있습니다.
          </p>
          {photos.items.length > 0 && (
            <p className="guest-flow-caution">
              사진과 이상 항목의 연결은 최종 제출할 때 저장됩니다. 이 화면에서는
              유지되지만, 링크를 새로 열면 다시 선택해 주세요.
            </p>
          )}
          <DraftResumeLink
            token={token}
            expiresAt={draft.expiresAt}
            disabled={locked}
            guided
          />
          <Button disabled={locked} onClick={resume}>
            계속 작성하기
          </Button>
        </section>
      ) : step === 2 && review ? (
        <>
          {!reviewCurrent && (
            <p className="guest-draft-notice" role="alert">
              저장 내용 또는 사진 상태가 달라졌습니다. 이전 단계에서 다시 확인해
              주세요.
            </p>
          )}
          <GuestSubmissionReview
            draft={review.draft}
            photos={review.photos}
            assignments={review.assignments}
            disabled={locked || !reviewCurrent}
            submitting={mutation === 'submitting'}
            onSubmit={submit}
            onCancel={back}
            backDisabled={locked}
          />
        </>
      ) : (
        <section className="guest-flow-actions" aria-label="작성 단계 이동">
          <p role="status">{saveLabel}</p>
          {photoWork && (
            <p className="guest-flow-caution" role="status">
              사진 처리와 선택한 파일의 확인을 마친 뒤 이동할 수 있습니다.
            </p>
          )}
          <div>
            {step === 1 && (
              <Button
                className="guest-draft-secondary"
                disabled={locked}
                onClick={back}
              >
                이전
              </Button>
            )}
            <Button
              loading={preparing}
              disabled={locked || (step === 1 && photos.blocked)}
              onClick={advance}
            >
              {step === 0 ? '다음: 사진' : '저장하고 제출 내용 확인'}
            </Button>
          </div>
          <button
            className="guest-flow-later-button"
            type="button"
            disabled={locked}
            onClick={() => {
              void continueLater();
            }}
          >
            나중에 계속하기
          </button>
          <p>일부만 작성해도 저장할 수 있습니다. 최종 제출과는 다릅니다.</p>
        </section>
      )}
      {!attempt && !later && step !== 2 && (
        <details className="guest-flow-recovery">
          <summary>이어쓰기 링크 · 저장 내용 확인</summary>
          <DraftResumeLink
            token={token}
            expiresAt={draft.expiresAt}
            disabled={locked}
            guided
          />
          <p>
            현재 입력은 자동 저장되지 않습니다. 나가기 전 ‘나중에 계속하기’를
            눌러 주세요.
          </p>
          <button
            type="button"
            className="guest-draft-reload"
            disabled={locked}
            onClick={session.reload}
          >
            서버에 저장된 내용 다시 불러오기
          </button>
        </details>
      )}
    </div>
  );
}
