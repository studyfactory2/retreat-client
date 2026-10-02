import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/ui/Button/Button';
import { GuestFrame } from '../entry/components/GuestFrame';
import { GuestAccessState } from '../entry/components/GuestAccessState';
import {
  buildGuestViewLocation,
  readGuestAccess,
} from '../entry/model/guest-entry-model';
import { useGuestIssueReport } from './hooks/use-guest-issue-report';
import { useGuestIssuePhotos } from './hooks/use-guest-issue-photos';
import { GuestIssuePhotos } from './components/GuestIssuePhotos';
import { GuestIssueFields } from './components/GuestIssueFields';
import { GuestIssueReview } from './components/GuestIssueReview';
import { GuestIssueReceipt } from './components/GuestIssueReceipt';
import { GuestIssueNotice } from './components/GuestIssueNotice';
import '../entry/styles/guest-entry.css';
import './styles/guest-issues.css';

export function GuestIssueScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const access = readGuestAccess(location.hash);
  const token = access.status === 'ready' ? access.token : null;
  const controller = useGuestIssueReport(token);
  const { resource } = controller;
  const ready = resource.status === 'ready';
  const [leave, setLeave] = useState<{
    token: string | null;
    href: string | null;
    message: string;
  } | null>(null);
  const visibleLeave = leave?.token === token ? leave : null;
  const locked =
    !ready ||
    resource.access !== 'ready' ||
    resource.mode !== 'edit' ||
    resource.attempt !== null ||
    resource.confirmation !== null;
  const photos = useGuestIssuePhotos({
    qrToken: token,
    propertyId: ready ? resource.context.property.id : null,
    disabled:
      locked ||
      visibleLeave !== null ||
      (ready && resource.categories.length === 0),
    onQrRejected: controller.rejectAccess,
  });
  const clearPhotos = photos.clear;
  const main = useRef<HTMLElement>(null);
  const notice = useRef<HTMLElement>(null);
  const mode = ready ? resource.mode : resource.status;
  const home = buildGuestViewLocation('qr', location.hash, 'home');
  const guide = buildGuestViewLocation('qr', location.hash, 'guide');
  const report = buildGuestViewLocation('qr', location.hash, 'report');
  useEffect(() => {
    main.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [location.hash, mode]);
  useEffect(() => {
    if (mode === 'received') clearPhotos();
  }, [mode, clearPhotos]);
  useEffect(() => {
    if (visibleLeave) {
      notice.current?.focus({ preventScroll: true });
      notice.current?.scrollIntoView({ block: 'start' });
    }
  }, [visibleLeave]);
  const confirmNavigation = (href: string) => {
    const allowed = [home, guide, report].map(
      (to) => `${to.pathname}${to.search}${to.hash}`,
    );
    if (!allowed.includes(href)) return false;
    if (href === allowed[2]) return true;
    if (
      !ready ||
      resource.attempt ||
      photos.busy ||
      resource.access !== 'ready'
    ) {
      setLeave({
        token,
        href: null,
        message: '진행 중인 요청과 접수 결과를 먼저 확인해 주세요.',
      });
      return false;
    }
    if (controller.dirty || photos.dirty) {
      setLeave({
        token,
        href,
        message:
          '작성한 내용과 첨부 사진의 접근 정보가 사라집니다. 이 신고는 임시 저장되지 않습니다.',
      });
      return false;
    }
    return true;
  };
  const goHome = () => {
    const href = `${home.pathname}${home.search}${home.hash}`;
    if (confirmNavigation(href)) navigate(home);
  };
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
            {visibleLeave && (
              <section
                className="guest-issue-notice"
                ref={notice}
                tabIndex={-1}
                role="alert"
              >
                <h2>
                  {visibleLeave.href
                    ? '작성 중인 신고를 나갈까요?'
                    : '잠시만 기다려 주세요'}
                </h2>
                <p>{visibleLeave.message}</p>
                <div className="guest-issue-actions">
                  {visibleLeave.href && (
                    <Button
                      disabled={
                        resource.attempt !== null ||
                        photos.busy ||
                        resource.access !== 'ready'
                      }
                      onClick={() => {
                        if (
                          !visibleLeave.href ||
                          resource.attempt ||
                          photos.busy ||
                          resource.access !== 'ready'
                        )
                          return;
                        photos.clear();
                        navigate(visibleLeave.href);
                      }}
                    >
                      작성 취소하고 이동
                    </Button>
                  )}
                  <Button
                    className="guest-issue-secondary"
                    onClick={() => setLeave(null)}
                  >
                    계속 머무르기
                  </Button>
                </div>
              </section>
            )}
            <GuestIssueNotice resource={resource} controller={controller} />
            {resource.mode === 'received' && resource.receipt ? (
              <GuestIssueReceipt
                receipt={resource.receipt}
                disabled={resource.access !== 'ready'}
                onHome={goHome}
              />
            ) : (
              <>
                <section className="guest-issue-intro">
                  <p className="guest-eyebrow">머무는 동안 필요한 도움</p>
                  <h1>
                    {resource.mode === 'review'
                      ? '신고 내용 확인'
                      : '불편사항 신고'}
                  </h1>
                  <p className="guest-issue-property">
                    {[
                      resource.context.property.region,
                      resource.context.property.name,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  <p>
                    이용 중 발견한 불편을 알려주세요.
                    <br />
                    관리자가 내용을 확인할 수 있도록 전달합니다.
                  </p>
                </section>
                {resource.mode === 'edit' ? (
                  <>
                    {resource.categories.length === 0 && (
                      <section className="guest-issue-notice" role="status">
                        <h2>신고 분류를 준비 중입니다</h2>
                        <p>
                          관리자에게 문의해 주세요. 분류가 준비되면 신고를
                          작성할 수 있습니다.
                        </p>
                        <Button
                          className="guest-issue-secondary"
                          disabled={resource.access === 'checking'}
                          onClick={controller.recheck}
                        >
                          분류 다시 확인
                        </Button>
                      </section>
                    )}
                    <GuestIssueFields
                      form={resource.form}
                      categories={resource.categories}
                      disabled={
                        locked ||
                        photos.busy ||
                        resource.categories.length === 0 ||
                        visibleLeave !== null
                      }
                      edit={controller.edit}
                    />
                    <GuestIssuePhotos controller={photos} />
                    <p className="guest-issue-hint">
                      작성 내용은 임시 저장되지 않습니다. 접수 전까지 이 화면을
                      유지해 주세요.
                    </p>
                    <div className="guest-issue-actions guest-issue-actions--footer">
                      <Button
                        className="guest-issue-secondary"
                        disabled={photos.busy}
                        onClick={goHome}
                      >
                        홈으로
                      </Button>
                      <Button
                        disabled={
                          locked ||
                          photos.busy ||
                          photos.blocked ||
                          resource.categories.length === 0 ||
                          visibleLeave !== null
                        }
                        onClick={() =>
                          controller.review(photos.getReadyClaims())
                        }
                      >
                        신고 내용 검토
                      </Button>
                    </div>
                  </>
                ) : (
                  <GuestIssueReview
                    resource={resource}
                    disabled={
                      resource.access !== 'ready' ||
                      resource.attempt !== null ||
                      photos.busy ||
                      visibleLeave !== null
                    }
                    onBack={controller.backToEdit}
                    onSubmit={() => controller.save(photos.getReadyClaims())}
                  />
                )}
              </>
            )}
          </>
        )}
      </GuestFrame>
    </div>
  );
}
