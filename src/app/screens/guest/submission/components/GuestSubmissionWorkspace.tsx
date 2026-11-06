import type { useGuestSubmission } from '../hooks/use-guest-submission';
import type { ReadyGuestSubmission } from '../model/guest-submission-model';
import { GUEST_CORRECTION_MAX_BASE_REVISION } from '../../../../features/guest-submission-details/guest-submission-details-validation';
import { Button } from '../../../../shared/ui/Button/Button';
import { DraftResumeLink } from '../../draft/components/DraftResumeLink';
import {
  GuestSubmissionMetadata,
  GuestSubmissionSummary,
} from './GuestSubmissionSummary';
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
  const itemLabels = new Map(
    detail.template.definition.sections.flatMap((section) =>
      section.items.map((item) => [item.id, item.label] as const),
    ),
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
        <>
          <div className="guest-record-layout">
            <section
              className="guest-record-card guest-record-answers"
              aria-labelledby="guest-record-answers-title"
            >
              <header className="guest-record-toolbar">
                <h2 id="guest-record-answers-title">시설 점검</h2>
                <Button
                  className="guest-draft-secondary"
                  disabled={locked}
                  onClick={controller.requestReload}
                >
                  최신 내용 확인
                </Button>
              </header>
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
                    </article>
                  ))}
                </section>
              ))}
            </section>
            <section
              className="guest-record-card guest-record-extras"
              aria-label="사진과 추가 정보"
            >
              <details className="guest-record-disclosure">
                <summary>첨부 사진 {detail.photos.length}장</summary>
                {detail.photos.length ? (
                  detail.photos.map((photo) => (
                    <GuestSubmissionPhoto
                      key={`${photo.id}:${detail.revision}`}
                      photo={photo}
                      label={
                        photo.purpose === 'ROOM_CONDITION'
                          ? '객실 상태'
                          : (itemLabels.get(photo.itemId) ?? '이상 항목')
                      }
                      token={token}
                      revision={detail.revision}
                      expiresAt={detail.expiresAt}
                      disabled={locked}
                      rejectAccess={controller.rejectAccess}
                    />
                  ))
                ) : (
                  <p className="guest-record-empty">첨부된 사진이 없어요.</p>
                )}
              </details>
              <details className="guest-record-disclosure">
                <summary>전체 메모</summary>
                <p className="guest-submitted-text">
                  {detail.answers.generalNote || '작성한 메모가 없어요.'}
                </p>
              </details>
              <GuestSubmissionMetadata detail={detail} />
              <DraftResumeLink
                token={token}
                expiresAt={detail.expiresAt}
                disabled={locked}
                completed
                showHomeHelp={!onReceipt}
              />
            </section>
          </div>
          <div className="guest-submitted-actions guest-record-navigation-actions">
            {onReceipt && (
              <Button
                className="guest-draft-secondary"
                disabled={locked}
                onClick={onReceipt}
              >
                최초 제출 확인
              </Button>
            )}
            <Button
              disabled={
                locked || detail.revision > GUEST_CORRECTION_MAX_BASE_REVISION
              }
              onClick={controller.startEdit}
            >
              답변 수정
            </Button>
          </div>
          {detail.revision > GUEST_CORRECTION_MAX_BASE_REVISION && (
            <p role="status">
              더 이상 수정할 수 없는 버전입니다. 관리자에게 문의해 주세요.
            </p>
          )}
        </>
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
                  변경 내용 검토
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
