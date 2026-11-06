import { GuestPageHeader } from '../components/GuestPageHeader';
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNavigationGuard } from '../../../core/router/navigation/use-navigation-guard';
import { Button } from '../../../shared/ui/Button/Button';
import { guestDraftOrigin } from '../../../features/guest-entry/guest-draft-origin';
import { GuestRecordNavigation } from '../components/GuestRecordNavigation';
import { readGuestAccess } from '../entry/model/guest-entry-model';
import { useGuestSubmission } from './hooks/use-guest-submission';
import { GuestSubmissionWorkspace } from './components/GuestSubmissionWorkspace';
import '../draft/styles/guest-draft.css';
import './styles/guest-submission.css';

export function GuestSubmissionScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const access = readGuestAccess(location.hash);
  const token = access.status === 'ready' ? access.token : null;
  const controller = useGuestSubmission(token);
  useNavigationGuard(controller.hasPendingWork);
  const { resource } = controller;
  const origin =
    token && resource.status === 'ready'
      ? guestDraftOrigin(resource.detail, token)
      : null;
  const main = useRef<HTMLElement>(null);
  const mode = resource.status === 'ready' ? resource.mode : resource.status;
  useEffect(() => {
    main.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [location.hash, mode]);
  return (
    <div className="guest-draft guest-submitted">
      <button
        className="guest-draft-skip"
        onClick={() => main.current?.focus()}
      >
        본문으로 바로가기
      </button>
      <GuestPageHeader />
      <main
        ref={main}
        tabIndex={-1}
        className="guest-draft-main"
        aria-busy={token !== null && resource.status === 'loading'}
      >
        {access.status !== 'ready' ? (
          <section className="guest-draft-card guest-draft-state" role="alert">
            <h1>제출 링크를 확인해 주세요</h1>
            <p>보관한 작성 링크 전체를 다시 열어 주세요.</p>
          </section>
        ) : resource.status === 'loading' ? (
          <section className="guest-draft-card guest-draft-state" role="status">
            <h1>제출 내용을 불러오고 있습니다</h1>
            <p>잠시만 기다려 주세요.</p>
          </section>
        ) : resource.status === 'error' ? (
          <section className="guest-draft-card guest-draft-state" role="alert">
            <h1>제출 내용을 열 수 없습니다</h1>
            <p>{resource.message}</p>
            <div className="guest-submitted-actions">
              {resource.kind === 'request' && (
                <Button onClick={controller.recheck}>다시 확인</Button>
              )}
              <Button
                className="guest-draft-secondary"
                onClick={() =>
                  navigate({ pathname: '/draft', hash: location.hash })
                }
              >
                최초 제출 확인
              </Button>
            </div>
          </section>
        ) : (
          <GuestSubmissionWorkspace
            controller={controller}
            resource={resource}
            token={access.token}
            onReceipt={
              origin
                ? () => navigate({ pathname: '/draft', hash: location.hash })
                : undefined
            }
          />
        )}
      </main>
      {token && resource.status === 'ready' && resource.access === 'ready' && (
        <GuestRecordNavigation
          origin={origin}
          token={token}
          page="submission"
        />
      )}
    </div>
  );
}
