import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AdminStayDto } from '../../../../features/admin-stays/admin-stays.types';
import { isStayRevision } from '../../../../features/admin-stays/admin-stays-validation';
import { Button } from '../../../../shared/ui/Button/Button';
import { AdminBackButton } from '../../components/AdminBackButton';
import { useStayDetailNavigation } from '../hooks/use-stay-detail-navigation';
import { useStayDetailSummaries } from '../hooks/use-stay-detail-summaries';
import { StayAccessCodeCard } from './StayAccessCodeCard';
import { StayDetails, StayInformation } from './StayDetails';
import { StayDetailIcon } from './StayDetailIcon';
import { StayDetailLeaveNotice } from './StayDetailLeaveNotice';
import { StayDetailPanel } from './StayDetailPanel';
import { StayHistory } from './StayHistory';
import { StayLinkCard } from './StayLinkCard';
import { StayStatusAction } from './StayStatusAction';
import { StayVehicleCard } from './StayVehicleCard';
import '../styles/stay-detail.css';

type Panel = 'password' | 'link' | 'vehicle' | 'history' | 'info';
const titles: Record<Panel, string> = {
  password: '예약 비밀번호',
  link: '개인 이용 링크',
  vehicle: '차량 정보',
  history: '변경 이력',
  info: '예약 정보',
};
const wideQuery = '(min-width: 1120px)';
const noop = () => {};

export function StayDetailWorkspace({
  stay,
  token,
  rejectSession,
  returnLabel,
  onBack,
  onEdit,
  onRefresh,
  notice,
  onNotice,
}: {
  stay: AdminStayDto;
  token: string;
  rejectSession: (token: string) => void;
  returnLabel: string;
  onBack: () => void;
  onEdit: () => void;
  onRefresh: () => void;
  notice: string | null;
  onNotice: (message: string | null) => void;
}) {
  const [wide, setWide] = useState(() => window.matchMedia(wideQuery).matches);
  const [selected, setSelected] = useState<Panel | null>(() =>
    window.matchMedia(wideQuery).matches ? 'password' : null,
  );
  const [changingStatus, setChangingStatus] = useState(false);
  const [historySummary, setHistorySummary] = useState('기록 보기');
  const menu = useRef<HTMLDetailsElement>(null);
  const navigate = useNavigate();
  const navigation = useStayDetailNavigation();
  const { summaries, updateSummary } = useStayDetailSummaries(
    stay,
    token,
    rejectSession,
  );
  const passwordSummary = useCallback(
    (value: string) => updateSummary('password', value),
    [updateSummary],
  );
  const linkSummary = useCallback(
    (value: string) => updateSummary('link', value),
    [updateSummary],
  );
  const vehicleSummary = useCallback(
    (value: string) => updateSummary('vehicle', value),
    [updateSummary],
  );
  const disabled = changingStatus || navigation.busy || !!navigation.pending;
  useEffect(() => {
    const media = window.matchMedia(wideQuery);
    const update = () => setWide(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  function refresh() {
    onNotice(null);
    onRefresh();
  }
  function open(panel: Panel) {
    if (selected === panel) return;
    navigation.request(() => setSelected(panel));
  }
  function row(panel: Exclude<Panel, 'info'>, secondary = false) {
    const label = panel === 'history' ? historySummary : summaries[panel];
    return (
      <button
        type="button"
        className={`stay-detail-row${secondary ? ' stay-detail-row--secondary' : ''}`}
        data-panel={panel}
        data-selected={selected === panel}
        aria-expanded={selected === panel}
        aria-controls={selected === panel ? 'stay-detail-panel' : undefined}
        disabled={disabled}
        onClick={() => open(panel)}
      >
        <span className="stay-detail-row__icon">
          <StayDetailIcon name={panel} />
        </span>
        <span className="stay-detail-row__text">
          <strong>{titles[panel]}</strong>
          <small>{label}</small>
        </span>
        <StayDetailIcon name="chevron" />
      </button>
    );
  }
  const warning = navigation.pending && (
    <StayDetailLeaveNotice
      receipt={navigation.pending.receipt}
      onKeep={navigation.keep}
      onProceed={navigation.proceed}
    />
  );

  return (
    <div className="admin-stay admin-stay--detail stay-compact">
      <header className="stay-detail-heading">
        <div className="admin-page-heading-title">
          <AdminBackButton
            label={returnLabel}
            disabled={disabled}
            onBack={() => navigation.request(onBack)}
          />
          <h1>이용 일정 상세</h1>
        </div>
        {!changingStatus && (
          <div className="stay-detail-heading__actions">
            {stay.status === 'ACTIVE' &&
              isStayRevision(stay.currentRevision) && (
                <Button
                  className="admin-button-secondary stay-detail-edit"
                  disabled={disabled}
                  onClick={() => navigation.request(onEdit)}
                >
                  수정
                </Button>
              )}
            <Button
              className="admin-button-ghost stay-detail-icon-button"
              aria-label="이용 일정 새로고침"
              disabled={disabled}
              onClick={() => navigation.request(refresh)}
            >
              <StayDetailIcon name="refresh" />
            </Button>
            {isStayRevision(stay.currentRevision) && (
              <details className="stay-detail-menu" ref={menu}>
                <summary aria-label="일정 더보기">
                  <StayDetailIcon name="more" />
                </summary>
                <div>
                  <Button
                    className="admin-button-ghost stay-detail-menu__refresh"
                    disabled={disabled}
                    onClick={() => navigation.request(refresh)}
                  >
                    새로고침
                  </Button>
                  <Button
                    className="admin-button-ghost"
                    disabled={
                      disabled ||
                      (stay.status === 'CANCELLED' && !stay.property.isActive)
                    }
                    onClick={() =>
                      navigation.request(() => {
                        if (menu.current) menu.current.open = false;
                        setSelected(null);
                        onNotice(null);
                        setChangingStatus(true);
                      })
                    }
                  >
                    {stay.status === 'ACTIVE' ? '일정 취소' : '일정 복원'}
                  </Button>
                </div>
              </details>
            )}
          </div>
        )}
      </header>
      {notice && (
        <p className="stay-detail-notice" role="status">
          {notice}
          <button
            type="button"
            aria-label="알림 닫기"
            onClick={() => onNotice(null)}
          >
            <StayDetailIcon name="close" />
          </button>
        </p>
      )}
      {stay.status === 'CANCELLED' && (
        <p className="stay-banner">
          {stay.property.isActive
            ? '취소된 일정입니다. 더보기에서 복원할 수 있습니다.'
            : '취소된 일정입니다. 복원하려면 휴양소를 활성화해 주세요.'}
        </p>
      )}
      {changingStatus ? (
        <StayStatusAction
          stay={stay}
          token={token}
          rejectSession={rejectSession}
          onClose={() => setChangingStatus(false)}
          onReload={() => {
            setChangingStatus(false);
            refresh();
          }}
          onSaved={(saved) => {
            setChangingStatus(false);
            onNotice(
              saved.status === 'CANCELLED'
                ? '이용 일정이 취소되었습니다.'
                : '이용 일정이 복원되었습니다.',
            );
            onRefresh();
          }}
        />
      ) : (
        <div
          className={`stay-detail-workspace${selected && wide ? ' stay-detail-workspace--open' : ''}`}
        >
          <div className="stay-detail-overview">
            <StayDetails
              stay={stay}
              onMore={() => open('info')}
              disabled={disabled}
              expanded={selected === 'info'}
            />
            <h2 className="stay-detail-section-label">이용객 안내</h2>
            <div className="stay-detail-rows">
              {row('password')}
              {row('link')}
            </div>
            <div className="stay-detail-extras">
              <button
                type="button"
                className="stay-detail-row stay-detail-row--secondary"
                disabled={disabled}
                onClick={() =>
                  navigation.request(() =>
                    navigate(`/admin/submissions?stayId=${stay.id}`),
                  )
                }
              >
                <span className="stay-detail-row__icon">
                  <StayDetailIcon name="checks" />
                </span>
                <span className="stay-detail-row__text">
                  <strong>연결된 체크리스트</strong>
                </span>
                <StayDetailIcon name="chevron" />
              </button>
              {row('vehicle', true)}
              {row('history', true)}
            </div>
          </div>
          {selected && (
            <StayDetailPanel
              title={titles[selected]}
              wide={wide}
              busy={navigation.busy || !!navigation.pending}
              onClose={() => navigation.request(() => setSelected(null))}
            >
              {warning}
              <div inert={!!navigation.pending}>
                {selected === 'password' && (
                  <StayAccessCodeCard
                    stay={stay}
                    token={token}
                    rejectSession={rejectSession}
                    actionsDisabled={!!navigation.pending}
                    onInteractionChange={noop}
                    registerGuard={navigation.register}
                    onSummaryChange={passwordSummary}
                    onReloadStay={() => navigation.request(refresh)}
                  />
                )}
                {selected === 'link' && (
                  <StayLinkCard
                    stay={stay}
                    token={token}
                    rejectSession={rejectSession}
                    navigationPending={!!navigation.pending}
                    registerGuard={navigation.register}
                    onSummaryChange={linkSummary}
                    onReloadStay={() => navigation.request(refresh)}
                  />
                )}
                {selected === 'vehicle' && (
                  <StayVehicleCard
                    stay={stay}
                    token={token}
                    rejectSession={rejectSession}
                    actionsDisabled={!!navigation.pending}
                    onSummaryChange={vehicleSummary}
                    onReloadStay={() => navigation.request(refresh)}
                  />
                )}
                {selected === 'history' && (
                  <StayHistory
                    stayId={stay.id}
                    currentRevision={stay.currentRevision}
                    token={token}
                    rejectSession={rejectSession}
                    onSummaryChange={setHistorySummary}
                  />
                )}
                {selected === 'info' && <StayInformation stay={stay} />}
              </div>
            </StayDetailPanel>
          )}
          {!selected && warning}
        </div>
      )}
    </div>
  );
}
