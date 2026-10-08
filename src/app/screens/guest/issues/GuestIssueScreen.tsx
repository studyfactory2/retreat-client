import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '../../../shared/ui/Button/Button';
import { GuestFrame } from '../entry/components/GuestFrame';
import { GuestAccessState } from '../entry/components/GuestAccessState';
import { readGuestAccess } from '../entry/model/guest-entry-model';
import { useGuestIssueReport } from './hooks/use-guest-issue-report';
import { useGuestIssueWorkspace } from './hooks/use-guest-issue-workspace';
import { GuestIssuePhotos } from './components/GuestIssuePhotos';
import { GuestIssueFields } from './components/GuestIssueFields';
import { GuestIssueReview } from './components/GuestIssueReview';
import { GuestIssueReviewActions } from './components/GuestIssueReviewActions';
import { GuestIssueReceipt } from './components/GuestIssueReceipt';
import { GuestIssueNotice } from './components/GuestIssueNotice';
import { GuestIssueLeaveNotice } from './components/GuestIssueLeaveNotice';
import { GuestIssueProgress } from './components/GuestIssueProgress';
import { GuestIssueUnavailable } from './components/GuestIssueUnavailable';
import '../entry/styles/guest-entry.css';
import './styles/guest-issues.css';

export function GuestIssueScreen() {
  const location = useLocation();
  const access = readGuestAccess(location.hash);
  const token = access.status === 'ready' ? access.token : null;
  const controller = useGuestIssueReport(token);
  const { resource } = controller;
  const ready = resource.status === 'ready';
  const {
    photos,
    home,
    guide,
    report,
    visibleLeave,
    navigationLocked,
    confirmNavigation,
    goHome,
    stay,
    discardAndLeave,
  } = useGuestIssueWorkspace({ token, hash: location.hash, controller });
  const clearPhotos = photos.clear;
  const main = useRef<HTMLElement>(null);
  const mode = ready ? resource.mode : resource.status;
  useEffect(() => {
    main.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [location.hash, mode]);
  useEffect(() => {
    // A confirmed receipt consumes the local claims; never delete claimed evidence.
    if (mode === 'received') clearPhotos();
  }, [mode, clearPhotos]);
  const locked =
    !ready ||
    resource.access !== 'ready' ||
    resource.attempt !== null ||
    resource.confirmation !== null ||
    visibleLeave !== null;
  const emptyCategories =
    ready && resource.mode === 'edit' && resource.categories.length === 0;
  return (
    <div className="guest-issues">
      <GuestFrame
        mainRef={main}
        view="report"
        home={home}
        guide={guide}
        report={report}
        ready={ready}
        refreshing={
          resource.status === 'loading' ||
          (ready &&
            (resource.access === 'checking' || resource.mutation === 'saving'))
        }
        confirmNavigation={confirmNavigation}
      >
        {access.status !== 'ready' ? (
          <GuestAccessState kind="qr" state={access.status} />
        ) : resource.status === 'loading' ? (
          <GuestAccessState kind="qr" state="loading" />
        ) : resource.status === 'error' ? (
          <GuestAccessState
            kind="qr"
            state={resource.kind}
            message={resource.message}
            onRetry={
              resource.kind === 'request' ? controller.recheck : undefined
            }
          />
        ) : (
          <>
            {resource.mode !== 'received' && (
              <header className="guest-issue-intro">
                <p className="guest-issue-property">
                  {[
                    resource.context.property.region,
                    resource.context.property.name,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <h1>불편사항 신고</h1>
                <p>
                  {resource.mode === 'review'
                    ? '작성한 내용과 사진을 확인한 뒤 접수해 주세요.'
                    : '이용 중 불편했던 점을 알려주세요.'}
                </p>
              </header>
            )}
            <GuestIssueProgress mode={resource.mode} />
            {visibleLeave && (
              <GuestIssueLeaveNotice
                message={visibleLeave.message}
                canLeave={visibleLeave.href !== null}
                locked={navigationLocked}
                onLeave={discardAndLeave}
                onStay={stay}
              />
            )}
            <GuestIssueNotice resource={resource} controller={controller} />
            {resource.mode === 'received' && resource.receipt ? (
              <GuestIssueReceipt
                receipt={resource.receipt}
                contactPhone={resource.context.property.publicContactPhone}
                disabled={resource.access !== 'ready'}
                onHome={goHome}
              />
            ) : (
              <>
                {emptyCategories && (
                  <GuestIssueUnavailable
                    phone={resource.context.property.publicContactPhone}
                    checking={resource.access === 'checking'}
                    contactDisabled={resource.access !== 'ready'}
                    hasWork={controller.dirty || photos.dirty}
                    onRetry={controller.recheck}
                  />
                )}
                <div className="guest-issue-workspace" hidden={emptyCategories}>
                  <div hidden={resource.mode !== 'edit'}>
                    <GuestIssueFields
                      form={resource.form}
                      categories={resource.categories}
                      disabled={
                        locked ||
                        photos.busy ||
                        emptyCategories ||
                        resource.mode !== 'edit'
                      }
                      edit={controller.edit}
                    />
                  </div>
                  <div hidden={resource.mode !== 'review'}>
                    <GuestIssueReview resource={resource} />
                  </div>
                  {/* One stable gallery preserves its claims and previews across edit/review. */}
                  <GuestIssuePhotos
                    controller={photos}
                    readOnly={resource.mode !== 'edit'}
                  />
                  {resource.mode === 'edit' ? (
                    <div className="guest-issue-writing-actions">
                      <p className="guest-issue-hint">
                        자동 저장되지 않습니다. 접수 전까지 이 창을 유지해
                        주세요.
                      </p>
                      <Button
                        disabled={
                          locked ||
                          photos.busy ||
                          photos.blocked ||
                          emptyCategories
                        }
                        onClick={() =>
                          controller.review(photos.getReadyClaims())
                        }
                      >
                        다음: 내용 확인
                      </Button>
                    </div>
                  ) : (
                    <GuestIssueReviewActions
                      resource={resource}
                      disabled={locked || photos.busy}
                      photoBlocked={photos.blocked}
                      onBack={controller.backToEdit}
                      onSubmit={() => controller.save(photos.getReadyClaims())}
                    />
                  )}
                </div>
              </>
            )}
          </>
        )}
      </GuestFrame>
    </div>
  );
}
