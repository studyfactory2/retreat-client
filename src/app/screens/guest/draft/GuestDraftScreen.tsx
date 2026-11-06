import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNavigationGuard } from '../../../core/router/navigation/use-navigation-guard';
import { Button } from '../../../shared/ui/Button/Button';
import { guestDraftOrigin } from '../../../features/guest-entry/guest-draft-origin';
import { GuestRecordNavigation } from '../components/GuestRecordNavigation';
import { GuestPageHeader } from '../components/GuestPageHeader';
import { buildGuestViewLocation, readGuestAccess } from '../entry/model/guest-entry-model';
import { GuestSubmissionScreen } from '../submission';
import { GuestDraftForm } from './components/GuestDraftForm';
import { GuestSubmissionReceipt } from './components/GuestSubmissionReceipt';
import { useGuestDraft } from './hooks/use-guest-draft';
import './styles/guest-draft.css';
import './styles/guest-flow.css';

export function GuestDraftScreen() {
  const location = useLocation();
  const views = new URLSearchParams(location.search).getAll('view');
  return views.length === 1 && views[0] === 'submission' ? (
    <GuestSubmissionScreen />
  ) : (
    <GuestDraftSessionScreen />
  );
}

function GuestDraftSessionScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const access = readGuestAccess(location.hash);
  const token = access.status === 'ready' ? access.token : null;
  const draft = useGuestDraft(token);
  useNavigationGuard(draft.hasPendingWork);
  const main = useRef<HTMLElement>(null);
  const status =
    access.status === 'ready' ? draft.resource.status : access.status;
  useEffect(() => {
    main.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [location.pathname, location.hash, status]);
  const resource = draft.resource;
  const draftRecord = resource.status === 'submitted' ? resource.receipt
    : resource.status === 'ready' && resource.access === 'ready' ? resource.draft
    : null;
  const origin = token && draftRecord ? guestDraftOrigin(draftRecord, token) : null;
  const home = origin ? buildGuestViewLocation(origin.kind, origin.hash, 'home') : undefined;
  return (
    <div className="guest-draft guest-draft--journey">
      <button
        className="guest-draft-skip"
        onClick={() => {
          main.current?.focus();
          main.current?.scrollIntoView();
        }}
      >
        본문으로 바로가기
      </button>
      <GuestPageHeader />
      <main
        ref={main}
        tabIndex={-1}
        className="guest-draft-main"
        aria-busy={draft.resource.status === 'loading' && token !== null}
      >
        {access.status !== 'ready' ? (
          <section className="guest-draft-card guest-draft-state" role="alert">
            <h1>
              {access.status === 'missing'
                ? '작성 링크가 필요합니다'
                : '작성 링크를 확인해 주세요'}
            </h1>
            <p>
              복사해 둔 작성 링크 전체를 다시 열어 주세요. 처음 작성한다면
              현장의 이용객 QR 또는 개인 이용 링크에서 시작해 주세요.
            </p>
          </section>
        ) : draft.resource.status === 'loading' ? (
          <section className="guest-draft-card guest-draft-state" role="status">
            <h1>체크리스트를 불러오고 있습니다</h1>
          </section>
        ) : draft.resource.status === 'error' ? (
          <section className="guest-draft-card guest-draft-state" role="alert">
            <h1>
              {draft.resource.kind === 'unsupported'
                ? '직원용 작성 링크입니다'
                : '체크리스트를 열 수 없습니다'}
            </h1>
            <p>{draft.resource.message}</p>
            {draft.resource.kind === 'request' && (
              <Button onClick={draft.recheck}>다시 확인</Button>
            )}
          </section>
        ) : draft.resource.status === 'submitted' ? (
          <GuestSubmissionReceipt
            receipt={draft.resource.receipt}
            token={access.token}
            showHomeHelp={!origin}
          />
        ) : (
          <GuestDraftForm
            key={access.token}
            onHome={home ? () => navigate(home) : undefined}
            session={draft}
            resource={draft.resource}
            token={access.token}
          />
        )}
      </main>
      {token && draftRecord && (
        <GuestRecordNavigation
          origin={origin}
          token={token}
          page={resource.status === 'submitted' ? 'receipt' : 'draft'}
        />
      )}
    </div>
  );
}
