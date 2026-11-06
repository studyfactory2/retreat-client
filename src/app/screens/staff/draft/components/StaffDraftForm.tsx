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
    stepTitle,
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
  return (
    <>
      {!later && (
        <>
          <div className="staff-flow-heading">
            <p>{draft.property.name}</p>
            <div>
              <h1>청소·정비</h1>
              <span className="staff-flow-state">작성 중</span>
            </div>
            <span>
              {draft.author.name} <span aria-hidden="true">·</span>{' '}
              {draft.visitDate}
            </span>
          </div>
          {draft.cleaningTask && (
            <p className="staff-task-subtitle">
              {draft.cleaningTask.title} · {taskTime(draft.cleaningTask.dueAt)}
            </p>
          )}
          <ol className="staff-flow-steps" aria-label="정비 작성 단계">
            {['점검', '사진', '확인·제출'].map((label, index) => (
              <li
                key={label}
                aria-current={step === index ? 'step' : undefined}
                className={step > index ? 'is-complete' : ''}
              >
                <span>{step > index ? '✓' : index + 1}</span>
                {label}
              </li>
            ))}
          </ol>
        </>
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
        <>
          {!later && (
            <h2 ref={heading} tabIndex={-1} className="staff-flow-step-title">
              {stepTitle}
            </h2>
          )}
          <div hidden={step !== 0 || later}>
            <section className="staff-draft-card staff-flow-checklist">
              <div className="staff-flow-section-heading">
                <h2>{draft.template.title}</h2>
                <span>
                  필수 {answered} / {requiredCount}
                </span>
              </div>
              {draft.template.definition.sections.map((section, index) => (
                <section
                  className="staff-draft-section"
                  key={section.id}
                  aria-labelledby={`staff-section-${section.id}`}
                >
                  <h3 id={`staff-section-${section.id}`}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    {section.title}
                  </h3>
                  {section.items.map((item) => (
                    <StaffDraftAnswerField
                      key={item.id}
                      item={item}
                      disabled={disabled}
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
        </>
      )}
      {/* Keep photo inputs and queued files mounted across steps and interrupted submissions. */}
      <div hidden={step !== 1 || submission.locked || later}>
        <StaffDraftPhotos
          controller={photos}
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
        {photos.items.length > 0 && (
          <p className="staff-draft-hint">
            사진은 업로드되었어요. 사진 종류와 위치는 제출할 때 저장되며,
            페이지를 다시 열면 다시 선택해야 해요.
          </p>
        )}
      </div>
      {step === 2 && review && !submission.locked && !later && (
        <>
          {draft.cleaningTask ? (
            <>
              <StaffTaskPassword
                controller={taskPassword}
                disabled={disabled}
              />
              <details className="staff-task-review-details">
                <summary>
                  <strong>제출 내용 확인</strong>
                  <span>
                    점검 {review.draft.answers.items.length}개 · 사진{' '}
                    {review.inputs.length}장
                    {review.draft.answers.items.some(
                      (answer) => answer.value === 'ABNORMAL',
                    ) &&
                      ` · 이상 ${review.draft.answers.items.filter((answer) => answer.value === 'ABNORMAL').length}개`}
                  </span>
                </summary>
                <StaffSubmissionReview
                  draft={review.draft}
                  photos={review.inputs}
                />
              </details>
            </>
          ) : (
            <StaffSubmissionReview
              draft={review.draft}
              photos={review.inputs}
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
          <p className="staff-flow-save-state" aria-live="polite">
            {saveStateLabel}
          </p>
          <div className="staff-flow-buttons">
            {step > 0 && (
              <Button
                className="staff-flow-back"
                disabled={disabled}
                onClick={() => go(step - 1)}
              >
                이전
              </Button>
            )}
            <Button
              loading={saving || preparing}
              disabled={nextDisabled}
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
      )}
    </>
  );
}
