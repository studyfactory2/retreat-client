import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '../../../shared/ui/Button/Button';
import { useNavigationGuard } from '../../../core/router/navigation/use-navigation-guard';
import { readPrivateDraftToken } from '../../draft/entry/model/draft-entry-model';
import { StaffDraftFrame } from './components/StaffDraftFrame';
import { StaffDraftForm } from './components/StaffDraftForm';
import { StaffDraftPhotos } from './components/StaffDraftPhotos';
import { useStaffDraft } from './hooks/use-staff-draft';
import './styles/staff-draft.css';

export function StaffDraftScreen() {
  const location = useLocation();
  const token = readPrivateDraftToken(location.hash);
  const session = useStaffDraft(token);
  const main = useRef<HTMLElement>(null);
  const { resource, hasPendingWork } = session;
  useNavigationGuard(hasPendingWork);
  useEffect(() => {
    main.current?.focus({ preventScroll: true });
  }, [location.hash, resource.status]);
  return (
    <StaffDraftFrame mainRef={main} loading={resource.status === 'loading'}>
      {!token || resource.status === 'error' ? (
        <section className="staff-draft-card staff-draft-state" role="alert">
          <h1>작성 내용을 열 수 없습니다</h1>
          <p>
            {resource.status === 'error'
              ? resource.message
              : '보관한 개인 작성 링크 전체를 다시 열어 주세요.'}
          </p>
          {resource.status === 'error' && resource.kind === 'request' && (
            <Button onClick={session.recheck}>다시 확인</Button>
          )}
        </section>
      ) : resource.status === 'loading' ? (
        <section className="staff-draft-card staff-draft-state" role="status">
          <h1>정비 내용을 불러오고 있습니다</h1>
          <p>잠시만 기다려 주세요.</p>
        </section>
      ) : (
        <StaffDraftForm
          session={session}
          resource={resource}
          token={token}
          photos={
            <StaffDraftPhotos
              token={token}
              draftId={resource.draft.id}
              expiresAt={resource.draft.expiresAt}
              locked={!session.canEdit}
              accessReady={resource.access === 'ready'}
              onAccessRejected={session.rejectAccess}
            />
          }
        />
      )}
    </StaffDraftFrame>
  );
}
