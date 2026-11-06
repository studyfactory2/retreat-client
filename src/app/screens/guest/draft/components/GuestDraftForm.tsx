import { GuestPausedDraft } from './GuestPausedDraft';
import { GuestIcon } from '../../entry/components/GuestIcon';
import { Button } from '../../../../shared/ui/Button/Button';
import type { DraftResource } from '../hooks/use-guest-draft';
import {
  useGuestWorkflow,
  type GuestDraftSession,
} from '../hooks/use-guest-workflow';
import { GuestChecklistProgress } from '../../components/GuestChecklistProgress';
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
  onHome,
}: {
  onHome?: () => void;
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
    addIssuePhotos,
    lastIssuePhotoItem,
    openPhotos,
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
  const sections = draft.template.definition.sections;
  const hasIssues = answers.items.some((item) => item.value === 'ABNORMAL');
  const title = draft.type === 'CHECK_IN' ? '입실 체크' : '퇴실 체크';
  const unresolvedSave = mutation === 'conflict' || mutation === 'uncertain';
  const locked = disabled || photoWork;
  const showNotice = access === 'checking' ||
    (message && !attempt && (mutation !== 'saved' || access !== 'ready'));
  return (
    <div className="guest-flow">
      {!later && (
        <header className="guest-flow-intro">
          {onHome && !attempt && (
            <button className="guest-flow-home" type="button" onClick={onHome} aria-label="이용 안내 홈으로">
              <GuestIcon name="arrow" />
            </button>
          )}
          <div>
            <h1>{title}</h1>
            <p>{draft.property.name}</p>
          </div>
        </header>
      )}
      <div className="guest-flow-body">
        {showNotice && (
          <section className="guest-draft-notice" role={access === 'checking' ? 'status' : 'alert'}>
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
        {attempt ? (
          <h2 className="guest-flow-heading" ref={heading} tabIndex={-1}>
            제출 결과 확인
          </h2>
        ) : !later && (
          <GuestChecklistProgress step={step + 2} headingRef={heading} />
        )}
        <div className="guest-flow-panel" hidden={step !== 0 || later || attempt !== null}>
          <header className="guest-flow-panel__head">
            <h3 id="guest-checklist-title">{sections.length === 1 ? sections[0].title : '시설 점검'}</h3>
            {required > 0 && <span>필수 {answered} / {required} 응답</span>}
          </header>
          <GuestChecklistStep
            draft={draft}
            answers={answers}
            disabled={locked || step !== 0 || later}
            showMissing={step === 0 && !!workflowMessage}
            edit={session.edit}
            onIssuePhotos={draft.type === 'CHECK_IN' ? addIssuePhotos : undefined}
            photoStatus={(itemId) => {
              const count = photos.items.filter((photo) => assignments[photo.id] === itemId).length;
              const queued = photos.queue.filter((entry) => entry.assignment === itemId);
              if (queued.some((entry) => entry.status === 'failed' || entry.status === 'uncertain'))
                return '추가하지 못했거나 확인이 필요한 사진이 있어요.';
              if (queued.length) return `이상 사진 ${queued.length}장 업로드 중`;
              if (itemId === lastIssuePhotoItem && photos.resource.status === 'error')
                return '업로드 상태를 확인해 주세요.';
              if (itemId === lastIssuePhotoItem && photos.notice && !count) return photos.notice;
              return count > 0 ? `첨부한 이상 사진 ${count}장` : '';
            }}
            onOpenPhotos={openPhotos}
            photoPickerDisabled={
              photos.blocked || photos.items.length >= (photos.limits?.maxPhotos ?? 40)
            }
          />
        </div>
        {/* Keep the gallery and its private previews mounted through every stage. */}
        <div hidden={step !== 1 || later || attempt !== null}>
          <GuestDraftPhotos
            controller={photos}
            checkIn={draft.type === 'CHECK_IN'}
            hasIssues={hasIssues}
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
          <GuestPausedDraft
            draft={draft}
            token={token}
            heading={heading}
            hasPhotos={photos.items.length > 0}
            disabled={locked}
            onResume={resume}
            onHome={onHome}
          />
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
            {workflowMessage && <p className="guest-draft-notice" role="alert">{workflowMessage}</p>}
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
                {step === 0
                  ? '사진으로'
                  : photos.items.length === 0 ? '사진 없이 계속' : '제출 내용 확인'}
                <GuestIcon name="arrow" />
              </Button>
            </div>
          </section>
        )}
        {!attempt && !later && (
          <button
            className="guest-flow-later-button"
            type="button"
            disabled={locked}
            onClick={() => { void continueLater(); }}
          >
            나중에 이어쓰기
          </button>
        )}
      </div>
      {!later && !attempt && (
        <div className="guest-flow-extra">
          <details className="guest-flow-identity">
            <summary>이용 정보</summary>
            <dl>
              {draft.property.region && (
                <div>
                  <dt>지역</dt>
                  <dd>{draft.property.region}</dd>
                </div>
              )}
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
          {step !== 2 && (
            <details className="guest-flow-recovery">
              <summary>이어쓰기 링크 · 저장 내용 확인</summary>
              <DraftResumeLink
                token={token}
                expiresAt={draft.expiresAt}
                disabled={locked}
                guided
              />
              <p>
                현재 입력은 자동 저장되지 않습니다. 나가기 전 ‘나중에 이어쓰기’를
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
      )}
    </div>
  );
}
