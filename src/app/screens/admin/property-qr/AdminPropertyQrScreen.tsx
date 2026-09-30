import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';
import { useAdminSession } from '../../../core/session/use-admin-session';
import type { QrFlow } from '../../../features/admin-property-qr/admin-property-qr.types';
import { Button } from '../../../shared/ui/Button/Button';
import { PageState } from '../../../shared/ui/PageState/PageState';
import { QrConfirmation } from './components/QrConfirmation';
import { QrFlowCard } from './components/QrFlowCard';
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
      key={`${id}:${state.user.id}:${state.expiresAt}`}
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
  const { resource, mutation, receipts, refresh, rotate } = usePropertyQr(
    id,
    token,
    rejectSession,
  );
  const [confirmation, setConfirmation] = useState<{
    flow: QrFlow;
    expectedRotatedAt: string | null;
  } | null>(null);
  const notice = useRef<HTMLDivElement>(null);
  const busy = mutation.busyFlow !== null;
  const navigation = useQrNavigation(
    !!receipts.GUEST || !!receipts.STAFF,
    busy,
  );
  const disabled =
    busy ||
    mutation.blocked ||
    confirmation !== null ||
    navigation.pending !== null;
  useEffect(() => {
    if (mutation.message) notice.current?.focus();
  }, [mutation.message]);

  function returnToProperty() {
    navigation.request('return', () =>
      navigate(appRoutes.adminPropertyDetail.replace(':id', id)),
    );
  }
  function refreshStatus() {
    navigation.request('refresh', () => {
      void refresh();
    });
  }
  function cancelConfirmation() {
    const flow = confirmation?.flow;
    setConfirmation(null);
    requestAnimationFrame(() =>
      document.getElementById(`qr-${flow}-review`)?.focus(),
    );
  }

  return (
    <div className="property-qr">
      <header className="property-qr-heading">
        <div>
          <p className="property-qr-heading__eyebrow">PROPERTY QR</p>
          <h1>휴양소 QR 관리</h1>
          <p>
            {resource.status === 'ready'
              ? resource.data.property.name
              : '휴양소의 이용객용·직원용 QR을 관리합니다.'}
          </p>
        </div>
        <div className="property-qr-actions">
          <Button
            className="admin-button-secondary"
            disabled={busy || !!confirmation || !!navigation.pending}
            onClick={returnToProperty}
          >
            휴양소 정보로 돌아가기
          </Button>
          <Button
            className="admin-button-secondary"
            disabled={
              busy ||
              !!confirmation ||
              !!navigation.pending ||
              resource.status === 'loading'
            }
            onClick={refreshStatus}
          >
            최신 상태 확인
          </Button>
        </div>
      </header>

      {navigation.pending && (
        <QrNavigationNotice
          action={navigation.pending}
          onKeep={navigation.keep}
          onProceed={navigation.proceed}
        />
      )}

      {resource.status !== 'ready' ? (
        <div role={resource.status === 'error' ? 'alert' : 'status'}>
          <PageState
            title={
              resource.status === 'error'
                ? 'QR 정보를 불러오지 못했습니다'
                : 'QR 발급 상태를 확인하는 중'
            }
            description={
              resource.status === 'error'
                ? resource.message
                : '휴양소와 최신 발급 상태를 확인합니다.'
            }
          >
            {resource.status === 'error' && (
              <Button disabled={!!navigation.pending} onClick={refreshStatus}>
                다시 불러오기
              </Button>
            )}
          </PageState>
        </div>
      ) : (
        <>
          <section className="property-qr-overview" aria-label="휴양소 QR 안내">
            <div>
              <span
                className={`property-qr-overview__status${resource.data.qr.propertyIsActive ? '' : ' property-qr-overview__status--inactive'}`}
              >
                {resource.data.qr.propertyIsActive
                  ? '활성 휴양소'
                  : '비활성 휴양소'}
              </span>
              <h2>주소는 발급 직후에만 제공됩니다</h2>
              <p>
                서버에서 기존 QR 주소를 다시 조회할 수 없습니다. 발급 후 주소를
                복사하거나 이미지를 내려받아 안전하게 보관해 주세요.
              </p>
            </div>
            <p className="property-qr-overview__scope">
              점검표를 작성하려면 휴양소의 점검표와 담당 직원 설정이 필요합니다.
              이용객·직원용 입력 화면은 준비 중입니다.
            </p>
          </section>
          {!resource.data.qr.propertyIsActive && (
            <div className="property-qr-notice" role="status">
              <h2>비활성 휴양소는 QR을 발급할 수 없습니다</h2>
              <p>
                기존 QR의 접근도 중지됩니다. 휴양소를 다시 활성화하면 기존 QR이
                다시 활성화되며, 새 QR로 교체하면 이전 주소는 무효화됩니다.
              </p>
            </div>
          )}
          {mutation.message && (
            <div
              className={`property-qr-notice${mutation.tone === 'error' ? ' property-qr-notice--error' : ''}`}
              role={mutation.tone === 'error' ? 'alert' : 'status'}
              ref={notice}
              tabIndex={-1}
            >
              <p>{mutation.message}</p>
              {mutation.blocked && (
                <Button
                  className="admin-button-secondary"
                  disabled={!!navigation.pending}
                  onClick={refreshStatus}
                >
                  최신 발급 상태 다시 확인
                </Button>
              )}
            </div>
          )}
          {confirmation && (
            <QrConfirmation
              flow={confirmation.flow}
              replacing={confirmation.expectedRotatedAt !== null}
              propertyName={resource.data.property.name}
              onCancel={cancelConfirmation}
              onConfirm={() => {
                if (
                  busy ||
                  mutation.blocked ||
                  !resource.data.qr.propertyIsActive
                )
                  return;
                setConfirmation(null);
                void rotate(confirmation.flow, confirmation.expectedRotatedAt);
              }}
            />
          )}
          <div className="property-qr-grid">
            {(['GUEST', 'STAFF'] as const).map((flow) => (
              <QrFlowCard
                key={flow}
                flow={flow}
                state={resource.data.qr[qrFlowKey(flow)]}
                issue={
                  mutation.blocked || mutation.busyFlow === flow
                    ? undefined
                    : receipts[flow]
                }
                propertyName={resource.data.property.name}
                disabled={disabled || !resource.data.qr.propertyIsActive}
                busy={mutation.busyFlow === flow}
                reviewRequired={mutation.blocked}
                onIssue={() =>
                  setConfirmation({
                    flow,
                    expectedRotatedAt:
                      resource.data.qr[qrFlowKey(flow)].rotatedAt,
                  })
                }
              />
            ))}
          </div>
          <p className="property-qr-retention">
            새로 발급한 주소는 이 화면을 열어 둔 동안만 확인할 수 있습니다.
            페이지 이동·새로고침·로그아웃 전에 필요한 QR을 보관해 주세요.
          </p>
        </>
      )}
    </div>
  );
}
