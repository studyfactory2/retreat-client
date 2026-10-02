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
  onReceipt: () => void;
};
export function GuestSubmissionWorkspace({
  controller,
  resource,
  token,
  onReceipt,
}: Props) {
  const { detail } = resource;
  const locked =
    resource.access !== 'ready' ||
    resource.mutation === 'saving' ||
    resource.mutation === 'conflict' ||
    resource.attempt !== null ||
    resource.confirmation !== null;
  return (
    <>
      <section className="guest-draft-intro">
        <p className="guest-draft-eyebrow">
          {resource.mode === 'view' ? '제출 내역' : '제출 내용 수정'}
        </p>
        <h1>
          {detail.type === 'CHECK_IN' ? '입실 체크' : '퇴실 체크'}{' '}
          {resource.mode === 'view' ? '내용' : '수정'}
        </h1>
        <p className="guest-draft-property">
          {[detail.property.region, detail.property.name]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <p>
          {resource.mode === 'view'
            ? '제출한 답변과 사진을 확인하고, 잘못 작성한 내용을 바로잡을 수 있습니다.'
            : '이용객 정보와 체크리스트 항목은 제출 당시 내용으로 유지됩니다.'}
        </p>
      </section>
      <GuestSubmissionNotice resource={resource} controller={controller} />
      <GuestSubmissionSummary detail={detail} />
      {resource.mode === 'view' ? (
        <>
          <div className="guest-submitted-actions guest-submitted-toolbar">
            <Button
              disabled={
                locked || detail.revision > GUEST_CORRECTION_MAX_BASE_REVISION
              }
              onClick={controller.startEdit}
            >
              답변 수정
            </Button>
            <Button
              className="guest-draft-secondary"
              disabled={locked}
              onClick={controller.requestReload}
            >
              최신 내용 확인
            </Button>
          </div>
          {detail.revision > GUEST_CORRECTION_MAX_BASE_REVISION && (
            <p role="status">
              더 이상 수정할 수 없는 버전입니다. 관리자에게 문의해 주세요.
            </p>
          )}
          {detail.template.definition.sections.map((section) => (
            <section className="guest-draft-card" key={section.id}>
              <h2>{section.title}</h2>
              {section.items.map((item) => (
                <article className="guest-submitted-item" key={item.id}>
                  <h3>{item.label}</h3>
                  <GuestSubmittedAnswer
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
          <section className="guest-draft-card">
            <h2>전체 메모</h2>
            <p className="guest-submitted-text">
              {detail.answers.generalNote || '남긴 메모가 없습니다.'}
            </p>
          </section>
          <Button
            className="guest-draft-secondary"
            disabled={locked}
            onClick={onReceipt}
          >
            최초 제출 확인으로
          </Button>
          <DraftResumeLink
            token={token}
            expiresAt={detail.expiresAt}
            disabled={locked}
            completed
          />
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
