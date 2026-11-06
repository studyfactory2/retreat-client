import { taskPasswordRequirement } from '../model/staff-password-requirement';
import { StaffTaskPassword } from './StaffTaskPassword';
import { taskTime } from '../../../../features/cleaning-tasks/cleaning-tasks-display';
import { Button } from '../../../../shared/ui/Button/Button';
import {
  useStaffWorkflow,
  type StaffWorkflowOptions,
} from '../hooks/use-staff-workflow';
import { StaffDraftAnswerField } from './StaffDraftAnswerField';
import { StaffDraftPause } from './StaffDraftPause';
import { StaffDraftPhotos } from './StaffDraftPhotos';
import { StaffPhotoAssignmentFields } from './StaffPhotoAssignment';
import { StaffSubmissionReview } from './StaffSubmissionReview';
import { StaffSubmissionUncertain } from './StaffSubmissionUncertain';

export function StaffDraftForm({
  session,
  resource,
  token,
}: StaffWorkflowOptions) {
  const {
    draft,
    answers,
    step,
    review,
    assignments,
    preparing,
    later,
    message,
    heading,
    submission,
    taskPassword,
    accessReady,
    photos,
    unresolved,
    saving,
    disabled,
    answered,
    requiredCount,
    photoReady,
    reviewCurrent,
    editableDraft,
    confirming,
    cancelConfirmation,
    showMissing,
    saveStateLabel,
    nextDisabled,
    nextLabel,
    go,
    advance,
    continueLater,
    resume,
    assignPhoto,
    changeAnswerDetails,
    changeGeneralNote,
  } = useStaffWorkflow({ session, resource, token });
  const working = !later && !submission.locked;
  const requirement =
    step === 2 && draft.cleaningTask
      ? taskPasswordRequirement(taskPassword)
      : null;
  const steps = ['점검', '사진', '확인·제출'];
  return (
    <div className={working ? 'staff-work-layout' : 'staff-work-result'}>
      {working && (
        <header className="staff-work-context">
          <div>
            <span>{draft.property.name}</span>
            <strong>작성 중</strong>
          </div>
          <h1>{draft.cleaningTask?.title ?? '추가 정비 기록'}</h1>
          <p>
            {draft.cleaningTask
              ? taskTime(draft.cleaningTask.dueAt)
              : draft.visitDate}{' '}
            · {draft.author.name}
          </p>
        </header>
      )}
      <div className="staff-work-body">
        {working && (
          <section className="staff-work-progress" aria-label="정비 작성 단계">
            <div>
              <h2 ref={heading} tabIndex={-1}>
                {steps[step]}
              </h2>
              <span>{step + 1} / 3</span>
            </div>
            <ol>
              {steps.map((label, index) => (
                <li
                  key={label}
                  aria-current={index === step ? 'step' : undefined}
                  className={index <= step ? 'is-reached' : ''}
                >
                  <span className="staff-flow-sr-only">{label}</span>
                </li>
              ))}
            </ol>
          </section>
        )}
        {(resource.message || resource.access !== 'ready' || unresolved) &&
          !submission.locked && (
            <section className="staff-flow-notice" role="status">
              <strong>
                {resource.access === 'checking'
                  ? '연결 확인 중'
                  : unresolved
                    ? '저장 상태를 확인해 주세요'
                    : '작성 안내'}
              </strong>
              {resource.message && <p>{resource.message}</p>}
              <div className="staff-draft-actions">
                <Button
                  disabled={session.busy || preparing}
                  onClick={session.recheck}
                >
                  다시 확인
                </Button>
                {(unresolved || resource.access === 'blocked') && (
                  <Button
                    disabled={session.busy || preparing}
                    onClick={session.reload}
                  >
                    저장된 내용 불러오기
                  </Button>
                )}
              </div>
            </section>
          )}
        {submission.locked ? (
          <StaffSubmissionUncertain submission={submission} />
        ) : (
          <div hidden={step !== 0 || later}>
            <section className="staff-draft-card staff-flow-checklist">
              <div className="staff-flow-section-heading">
                <h2>{draft.template.title}</h2>
                <span>
                  필수 {answered} / {requiredCount}
                </span>
              </div>
              {draft.template.definition.sections.map((section) => (
                <section
                  className="staff-draft-section"
                  key={section.id}
                  aria-labelledby={`staff-section-${section.id}`}
                >
                  <h3 id={`staff-section-${section.id}`}>{section.title}</h3>
                  {section.items.map((item) => (
                    <StaffDraftAnswerField
                      key={item.id}
                      item={item}
                      disabled={disabled}
                      highlightMissing={showMissing}
                      answer={answers.items.find(
                        (answer) => answer.itemId === item.id,
                      )}
                      onValue={(value) => session.setAnswer(item.id, value)}
                      onDetails={(change) =>
                        changeAnswerDetails(item.id, change)
                      }
                    />
                  ))}
                </section>
              ))}
              <details className="staff-flow-details">
                <summary>
                  메모 추가 <span>선택</span>
                </summary>
                <label
                  className="staff-draft-note-label"
                  htmlFor="staff-general-note"
                >
                  추가로 전달할 내용
                </label>
                <textarea
                  id="staff-general-note"
                  disabled={disabled}
                  value={answers.generalNote ?? ''}
                  rows={3}
                  maxLength={4000}
                  placeholder="관리자에게 전달할 내용을 적어 주세요."
                  onChange={(event) => changeGeneralNote(event.target.value)}
                />
              </details>
            </section>
          </div>
        )}
        {/* Keep photo inputs and queued files mounted across steps and interrupted submissions. */}
        <div hidden={step !== 1 || submission.locked || later}>
          <StaffDraftPhotos
            controller={photos}
            assignments={assignments}
            requiredAfter={Boolean(draft.cleaningTask)}
            token={token}
            draftId={draft.id}
            expiresAt={draft.expiresAt}
            locked={disabled || step === 2}
            accessReady={accessReady}
            onAccessRejected={session.rejectAccess}
            renderAssignment={(photo) => (
              <StaffPhotoAssignmentFields
                id={photo.id}
                draft={editableDraft}
                value={assignments[photo.id]}
                disabled={disabled || photos.busy}
                onChange={(value) => assignPhoto(photo.id, value)}
              />
            )}
          />
        </div>
        {step === 2 && review && working && (
          <>
            <StaffSubmissionReview
              draft={review.draft}
              photos={review.inputs}
            />
            {draft.cleaningTask && (
              <StaffTaskPassword
                controller={taskPassword}
                disabled={disabled}
              />
            )}
          </>
        )}
        {step === 2 && !reviewCurrent && !submission.locked && !later && (
          <p className="staff-flow-notice" role="status">
            최신 저장 내용과 사진을 확인하고 있어요. 변경된 내용이 있다면 이전
            단계에서 다시 확인해 주세요.
          </p>
        )}
        {message && (
          <p className="staff-flow-notice is-error" role="alert">
            {message}
          </p>
        )}
        {submission.state.message && !submission.locked && (
          <p className="staff-flow-notice" role="alert">
            {submission.state.message}
          </p>
        )}
        {later && !submission.locked && (
          <StaffDraftPause
            heading={heading}
            draft={draft}
            token={token}
            saved={!session.dirty && !unresolved}
            linkDisabled={!accessReady || session.dirty || unresolved}
            hasPhotoSelections={photos.items.some((photo) =>
              Boolean(assignments[photo.id]),
            )}
            onResume={resume}
          />
        )}
        {!later && !submission.locked && (
          <div className="staff-flow-bottom">
            {requirement && (
              <p
                className="staff-work-requirement"
                id="staff-submit-requirement"
              >
                {requirement}
              </p>
            )}
            {confirming && (
              <p className="staff-work-confirm" role="status">
                이 내용으로 정비를 완료할까요?
              </p>
            )}
            <div className="staff-flow-buttons">
              {step > 0 && (
                <Button
                  className="staff-flow-back"
                  disabled={disabled}
                  onClick={confirming ? cancelConfirmation : () => go(step - 1)}
                >
                  {confirming ? '계속 검토' : '이전'}
                </Button>
              )}
              <Button
                loading={saving || preparing}
                disabled={nextDisabled}
                aria-describedby={
                  requirement ? 'staff-submit-requirement' : undefined
                }
                onClick={advance}
              >
                {nextLabel}
              </Button>
            </div>
            {step === 1 && !photoReady && (
              <p className="staff-draft-hint">
                사진 처리 결과를 확인하면 다음 단계로 갈 수 있어요.
              </p>
            )}
            <div className="staff-work-save-row">
              <p className="staff-flow-save-state" aria-live="polite">
                {saveStateLabel}
              </p>
              <button
                className="staff-flow-text-button"
                type="button"
                disabled={disabled}
                onClick={() => {
                  void continueLater();
                }}
              >
                나중에 계속하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
