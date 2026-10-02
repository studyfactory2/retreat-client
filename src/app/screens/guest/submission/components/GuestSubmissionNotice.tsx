import { useEffect, useRef } from 'react';
import type { useGuestSubmission } from '../hooks/use-guest-submission';
import type { ReadyGuestSubmission } from '../model/guest-submission-model';
import { Button } from '../../../../shared/ui/Button/Button';

type Controller = ReturnType<typeof useGuestSubmission>;
export function GuestSubmissionNotice({
  resource,
  controller,
}: {
  resource: ReadyGuestSubmission;
  controller: Controller;
}) {
  const notice = useRef<HTMLElement>(null);
  const confirmation = useRef<HTMLElement>(null);
  const focusKey =
    resource.confirmation ??
    (resource.access !== 'checking' &&
    ['error', 'conflict', 'uncertain'].includes(resource.mutation)
      ? resource.mutation
      : null);
  useEffect(() => {
    if (!focusKey) return;
    const target = confirmation.current ?? notice.current;
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: 'start' });
  }, [focusKey]);
  const checking =
    resource.access === 'checking' || resource.mutation === 'saving';
  return (
    <>
      {(resource.message || resource.access !== 'ready') && (
        <section
          ref={notice}
          tabIndex={-1}
          className="guest-submitted-notice"
          role={
            resource.mutation === 'error' ||
            resource.mutation === 'conflict' ||
            resource.mutation === 'uncertain' ||
            resource.access === 'blocked'
              ? 'alert'
              : 'status'
          }
        >
          <p>
            {resource.access === 'checking'
              ? '접근 권한과 최신 내용을 확인하고 있습니다…'
              : resource.message}
          </p>
          {resource.latest && resource.mutation !== 'saved' && (
            <p>
              서버에서 확인한 최신 버전: {resource.latest.revision}차 · 현재
              입력은 {resource.detail.revision}차 기준입니다.
            </p>
          )}
          {!resource.confirmation && (
            <div className="guest-submitted-actions">
              {(resource.access === 'blocked' || resource.attempt) && (
                <Button
                  className="guest-draft-secondary"
                  disabled={checking}
                  onClick={controller.recheck}
                >
                  결과 다시 확인
                </Button>
              )}
              {resource.attempt && !resource.attempt.receipt && (
                <Button
                  disabled={resource.access !== 'ready' || checking}
                  onClick={controller.retry}
                >
                  같은 수정 요청 재확인
                </Button>
              )}
              {((resource.mutation === 'conflict' && !resource.attempt) ||
                controller.canDiscardAttempt) && (
                <Button
                  className="guest-draft-secondary"
                  disabled={resource.access !== 'ready' || checking}
                  onClick={controller.requestReload}
                >
                  입력을 버리고 최신 내용 보기
                </Button>
              )}
            </div>
          )}
          {resource.attempt && (
            <p className="guest-submitted-hint">
              결과 확인 중에는 입력을 바꿀 수 없습니다. 재확인은 보관된 동일한
              수정 내용으로 요청합니다. 확인이 끝날 때까지 이 화면을 유지해
              주세요.
            </p>
          )}
        </section>
      )}
      {resource.confirmation && (
        <section
          className="guest-submitted-notice"
          role="alert"
          aria-label="수정 입력 버리기 확인"
          ref={confirmation}
          tabIndex={-1}
        >
          <h2>저장하지 않은 입력을 버릴까요?</h2>
          <p>
            {resource.attempt
              ? '이전 요청의 결과는 확정되지 않았습니다. 서버에서 확인한 최신 내용으로 이동하면 이 화면에 보관한 입력을 버립니다.'
              : '이 화면에서 수정한 답변과 사유가 사라집니다.'}
          </p>
          <div className="guest-submitted-actions">
            <Button disabled={checking} onClick={controller.confirmDiscard}>
              입력 버리고 확인
            </Button>
            <Button
              className="guest-draft-secondary"
              disabled={checking}
              onClick={controller.cancelDiscard}
            >
              돌아가기
            </Button>
          </div>
        </section>
      )}
    </>
  );
}
