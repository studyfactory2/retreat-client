import type { useGuestSubmission } from '../hooks/use-guest-submission';
import type { ReadyGuestSubmission } from '../model/guest-submission-model';
import { GUEST_CORRECTION_MAX_BASE_REVISION } from '../../../../features/guest-submission-details/guest-submission-details-validation';
import { Button } from '../../../../shared/ui/Button/Button';
import { DraftResumeLink } from '../../draft/components/DraftResumeLink';
import { GuestSubmissionSummary } from './GuestSubmissionSummary';
import { GuestSubmittedAnswer } from './GuestSubmittedAnswer';
import { GuestSubmissionPhoto } from './GuestSubmissionPhoto';
import { GuestSubmissionEditor } from './GuestSubmissionEditor';
import { GuestSubmissionReview } from './GuestSubmissionReview';
import { GuestSubmissionNotice } from './GuestSubmissionNotice';

type Props = {
  controller: ReturnType<typeof useGuestSubmission>;
  resource: ReadyGuestSubmission;
  token: string;
  onReceipt?: () => void;
};
export function GuestSubmissionWorkspace({
  controller,
  resource,
  token,
  onReceipt,
}: Props) {
  const { detail } = resource;
  const roomPhotos = detail.photos.filter(
    (photo) => photo.purpose === 'ROOM_CONDITION',
  );
  const locked =
    resource.access !== 'ready' ||
    resource.mutation === 'saving' ||
    resource.mutation === 'conflict' ||
    resource.attempt !== null ||
    resource.confirmation !== null;
  return (
    <>
      <GuestSubmissionSummary detail={detail} mode={resource.mode} />
      <GuestSubmissionNotice resource={resource} controller={controller} />
      {resource.mode === 'view' ? (
        <div className="guest-record-layout">
          <section
            className="guest-record-card guest-record-answers"
            aria-labelledby="guest-record-answers-title"
          >
            <header className="guest-record-toolbar">
              <h2 id="guest-record-answers-title">체크 내용</h2>
              <div className="guest-record-actions">
                <Button
                  className="guest-draft-secondary"
                  disabled={locked}
                  onClick={controller.requestReload}
                >
                  최신 내용 확인
                </Button>
                <Button
                  disabled={
                    locked ||
                    detail.revision > GUEST_CORRECTION_MAX_BASE_REVISION
                  }
                  onClick={controller.startEdit}
                >
                  답변 수정
                </Button>
              </div>
            </header>
            {detail.revision > GUEST_CORRECTION_MAX_BASE_REVISION && (
              <p role="status">
                더 이상 수정할 수 없는 버전입니다. 관리자에게 문의해 주세요.
              </p>
            )}
            {detail.template.definition.sections.map((section) => (
              <section className="guest-record-group" key={section.id}>
                <h3>{section.title}</h3>
                {section.items.map((item) => (
                  <article className="guest-submitted-item" key={item.id}>
                    <GuestSubmittedAnswer
                      label={item.label}
                      answer={detail.answers.items.find(
                        (answer) => answer.itemId === item.id,
                      )}
                    />
                    {detail.photos
                      .filter((photo) => photo.itemId === item.id)
                      .map((photo) => (
                        <GuestSubmissionPhoto
                          key={`${photo.id}:${detail.revision}`}
                          photo={photo}
                          label={item.label}
                          token={token}
                          revision={detail.revision}
                          expiresAt={detail.expiresAt}
                          disabled={locked}
                          rejectAccess={controller.rejectAccess}
                        />
                      ))}
                  </article>
                ))}
              </section>
            ))}
            {detail.answers.generalNote && (
              <section className="guest-record-note">
                <h3>전체 메모</h3>
                <p className="guest-submitted-text">
                  {detail.answers.generalNote}
                </p>
              </section>
            )}
          </section>
          <div className="guest-record-extras">
            {roomPhotos.length > 0 && (
              <section
                className="guest-record-card"
                aria-labelledby="guest-record-photos-title"
              >
                <h2 id="guest-record-photos-title">
                  객실 상태 사진 <span>{roomPhotos.length}장</span>
                </h2>
                {roomPhotos.map((photo) => (
                  <GuestSubmissionPhoto
                    key={`${photo.id}:${detail.revision}`}
                    photo={photo}
                    label="객실 상태"
                    token={token}
                    revision={detail.revision}
                    expiresAt={detail.expiresAt}
                    disabled={locked}
                    rejectAccess={controller.rejectAccess}
                  />
                ))}
              </section>
            )}
            <details className="guest-record-link">
              <summary>
                제출 확인 링크
                <span aria-hidden="true" className="guest-record-chevron" />
              </summary>
              <DraftResumeLink
                token={token}
                expiresAt={detail.expiresAt}
                disabled={locked}
                completed
                showHomeHelp={!onReceipt}
              />
            </details>
            {onReceipt && (
              <button
                className="guest-record-receipt"
                type="button"
                disabled={locked}
                onClick={onReceipt}
              >
                최초 제출 확인으로 <span aria-hidden="true">→</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {resource.mode === 'edit' ? (
            <>
              <GuestSubmissionEditor
                detail={detail}
                answers={resource.answers}
                reason={resource.reason}
                disabled={locked}
                edit={controller.edit}
                setReason={controller.setReason}
              />
              <div className="guest-submitted-actions">
                <Button
                  className="guest-draft-secondary"
                  disabled={locked}
                  onClick={controller.cancel}
                >
                  수정 취소
                </Button>
                <Button disabled={locked} onClick={controller.review}>
                  수정 내용 검토
                </Button>
              </div>
            </>
          ) : (
            <GuestSubmissionReview
              detail={detail}
              answers={resource.answers}
              reason={resource.reason}
              disabled={locked}
              pending={resource.attempt !== null}
              saving={resource.mutation === 'saving'}
              onBack={controller.backToEdit}
              onSave={controller.save}
            />
          )}
        </>
      )}
    </>
  );
}
