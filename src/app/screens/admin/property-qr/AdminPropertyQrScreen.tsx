import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';
import { useAdminSession } from '../../../core/session/use-admin-session';
import type { QrFlow } from '../../../features/admin-property-qr/admin-property-qr.types';
import { Button } from '../../../shared/ui/Button/Button';
import { PageState } from '../../../shared/ui/PageState/PageState';
import { AdminBackButton } from '../components/AdminBackButton';
import { QrConfirmation } from './components/QrConfirmation';
import { QrDetailPanel } from './components/QrDetailPanel';
import { QrDrawer } from './components/QrDrawer';
import { QrFlowRow } from './components/QrFlowRow';
import { QrNavigationNotice } from './components/QrNavigationNotice';
import { usePropertyQr } from './hooks/use-property-qr';
import { useQrNavigation } from './hooks/use-qr-navigation';
import { qrFlowKey } from './model/property-qr-model';
import './styles/property-qr.css';

export function AdminPropertyQrScreen() {
  const { id = '' } = useParams();
  const { state, rejectSession } = useAdminSession();
  if (state.status !== 'authenticated') return null;
  return (
    <PropertyQrWorkspace
      key={id + ':' + state.user.id + ':' + state.expiresAt}
      id={id}
      token={state.token}
      rejectSession={rejectSession}
    />
  );
}

function PropertyQrWorkspace({
  id,
  token,
  rejectSession,
}: {
  id: string;
  token: string;
  rejectSession: (token: string) => void;
}) {
  const navigate = useNavigate();
  const qr = usePropertyQr(id, token, rejectSession);
  const {
    resource,
    mutation,
    receipts,
    openingFlow,
    refresh,
    rotate,
    reopen,
    closePreview,
  } = qr;
  const [selected, setSelected] = useState<{
    flow: QrFlow;
    propertyName: string;
  } | null>(null);
  const [confirmation, setConfirmation] = useState<{
    flow: QrFlow;
    expectedRotatedAt: string | null;
  } | null>(null);
  const notice = useRef<HTMLDivElement>(null);
  const busy = mutation.busyFlow !== null;
  const navigation = useQrNavigation(qr);
  const disabled =
    busy ||
    openingFlow !== null ||
    mutation.blocked ||
    confirmation !== null ||
    navigation.pending !== null;

  useEffect(() => {
    if (mutation.message) notice.current?.focus();
  }, [mutation.message, selected]);
  useEffect(() => {
    function revalidate() {
      if (
        document.visibilityState !== 'visible' ||
        confirmation ||
        navigation.pending ||
        qr.isBusy() ||
        qr.hasOneTimeReceipt()
      )
        return;
      void refresh();
    }
    window.addEventListener('focus', revalidate);
    window.addEventListener('pageshow', revalidate);
    document.addEventListener('visibilitychange', revalidate);
    return () => {
      window.removeEventListener('focus', revalidate);
      window.removeEventListener('pageshow', revalidate);
      document.removeEventListener('visibilitychange', revalidate);
    };
  }, [confirmation, navigation.pending, qr, refresh]);

  function refreshStatus() {
    navigation.request('refresh', () => {
      void refresh();
    });
  }
  function cancelConfirmation() {
    const flow = confirmation?.flow;
    setConfirmation(null);
    requestAnimationFrame(() =>
      document.getElementById('qr-' + flow + '-review')?.focus(),
    );
  }
  function closePanel() {
    if (busy) return;
    if (navigation.pending) {
      navigation.keep();
      return;
    }
    if (confirmation) {
      cancelConfirmation();
      return;
    }
    navigation.request('close', () => {
      closePreview();
      setSelected(null);
    });
  }
  function openPanel(flow: QrFlow) {
    if (resource.status !== 'ready' || busy) return;
    navigation.request('select', () => {
      closePreview();
      setSelected({ flow, propertyName: resource.data.property.name });
      const state = resource.data.qr[qrFlowKey(flow)];
      if (state.enabled && state.canReopen && !mutation.blocked)
        void reopen(flow);
    });
  }

  // A native modal makes the page behind it inert; recovery and confirmation
  // controls belong in the open panel, not behind its backdrop.
  const notices = (
    <>
      {navigation.pending && (
        <QrNavigationNotice
          onKeep={navigation.keep}
          onProceed={navigation.proceed}
        />
      )}
      {mutation.message && (
        <div
          className={
            'property-qr-notice' +
            (mutation.tone === 'error' ? ' property-qr-notice--error' : '')
          }
          role={mutation.tone === 'error' ? 'alert' : 'status'}
          ref={notice}
          tabIndex={-1}
        >
          <p>{mutation.message}</p>
          {mutation.blocked && (
            <Button onClick={refreshStatus}>최신 상태 확인</Button>
          )}
        </div>
      )}
      {confirmation && resource.status === 'ready' && (
        <QrConfirmation
          flow={confirmation.flow}
          replacing={confirmation.expectedRotatedAt !== null}
          propertyName={resource.data.property.name}
          onCancel={cancelConfirmation}
          onConfirm={() => {
            if (busy || mutation.blocked || !resource.data.qr.propertyIsActive)
              return;
            setConfirmation(null);
            void rotate(confirmation.flow, confirmation.expectedRotatedAt);
          }}
        />
      )}
    </>
  );
  const resourceState = resource.status !== 'ready' && (
    <div
      role={resource.status === 'error' ? 'alert' : 'status'}
      className="property-qr-resource"
    >
      <PageState
        title={
          resource.status === 'error'
            ? 'QR 정보를 불러오지 못했습니다'
            : 'QR 정보를 확인하는 중'
        }
        description={
          resource.status === 'error'
            ? resource.message
            : '잠시만 기다려 주세요.'
        }
      >
        {resource.status === 'error' && (
          <Button onClick={refreshStatus}>다시 불러오기</Button>
        )}
      </PageState>
    </div>
  );

  return (
    <div className="property-qr">
      <header className="property-qr-heading">
        <div className="property-qr-heading__main">
          <AdminBackButton
            fallback={appRoutes.adminPropertyDetail.replace(':id', id)}
            label="휴양소 정보로 돌아가기"
            disabled={busy || !!confirmation || !!navigation.pending}
            onBack={() =>
              navigation.request('return', () =>
                navigate(appRoutes.adminPropertyDetail.replace(':id', id)),
              )
            }
          />
          <div>
            <h1>QR 관리</h1>
            {resource.status === 'ready' && (
              <p className="property-qr-heading__eyebrow">
                {resource.data.property.name}
              </p>
            )}
          </div>
        </div>
        <Button
          className="admin-button-ghost property-qr-refresh"
          aria-label="QR 상태 새로고침"
          title="새로고침"
          disabled={
            busy ||
            !!confirmation ||
            !!navigation.pending ||
            resource.status === 'loading'
          }
          onClick={refreshStatus}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M20 7v5h-5M4 17v-5h5M6.1 7a7 7 0 0 1 11.6-1.5L20 8M4 16l2.3 2.5A7 7 0 0 0 17.9 17" />
          </svg>
        </Button>
      </header>
      {!selected && notices}
      {resource.status !== 'ready' ? (
        !selected && resourceState
      ) : (
        <>
          {!resource.data.qr.propertyIsActive && (
            <div className="property-qr-notice" role="status">
              <p>
                비활성 휴양소입니다. 기존 QR은 유지되며, 휴양소를 다시
                활성화하면 사용할 수 있습니다.
              </p>
            </div>
          )}
          <section aria-labelledby="property-qr-list-title">
            <div className="property-qr-list-heading">
              <h2 id="property-qr-list-title">공용 QR</h2>
              <span>2개</span>
            </div>
            <ul className="property-qr-list">
              {(['GUEST', 'STAFF'] as const).map((flow) => (
                <QrFlowRow
                  key={flow}
                  flow={flow}
                  state={resource.data.qr[qrFlowKey(flow)]}
                  disabled={
                    busy ||
                    openingFlow !== null ||
                    !!confirmation ||
                    !!navigation.pending
                  }
                  onSelect={() => openPanel(flow)}
                />
              ))}
            </ul>
          </section>
          <details className="property-qr-help">
            <summary>QR 이용 안내</summary>
            <p>
              이용객 점검에는 입실·퇴실 점검표가, 직원 점검에는 정비 점검표와
              담당 직원 설정이 필요합니다. QR 열기·복사·저장은 기존 QR을 바꾸지
              않습니다.
            </p>
          </details>
        </>
      )}
      {selected && (
        <QrDrawer
          flow={selected.flow}
          propertyName={
            resource.status === 'ready'
              ? resource.data.property.name
              : selected.propertyName
          }
          busy={busy}
          refreshDisabled={
            busy ||
            openingFlow !== null ||
            !!confirmation ||
            !!navigation.pending ||
            resource.status === 'loading'
          }
          onRefresh={refreshStatus}
          onClose={closePanel}
        >
          {notices}
          {resource.status !== 'ready' ? (
            resourceState
          ) : (
            <QrDetailPanel
              flow={selected.flow}
              state={resource.data.qr[qrFlowKey(selected.flow)]}
              issue={
                busy || mutation.blocked || confirmation
                  ? undefined
                  : receipts[selected.flow]
              }
              propertyName={resource.data.property.name}
              disabled={disabled || !resource.data.qr.propertyIsActive}
              opening={openingFlow === selected.flow}
              issuing={mutation.busyFlow === selected.flow}
              reviewRequired={mutation.blocked}
              onOpen={() => {
                void reopen(selected.flow);
              }}
              onIssue={() =>
                setConfirmation({
                  flow: selected.flow,
                  expectedRotatedAt:
                    resource.data.qr[qrFlowKey(selected.flow)].rotatedAt,
                })
              }
            />
          )}
        </QrDrawer>
      )}
    </div>
  );
}
