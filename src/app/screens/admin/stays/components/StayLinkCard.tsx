import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { AdminStayDto } from '../../../../features/admin-stays/admin-stays.types';
import type { AdminStayLinkStatus, StayLinkAction } from '../../../../features/admin-stay-links/admin-stay-link.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { useStayLink } from '../hooks/use-stay-link';
import type { StayLinkNavigationGuard } from '../hooks/use-stay-link-navigation';
import { canIssueStayLink, canRevokeStayLink, formatStayLinkTimestamp, sameStayLinkStatus, stayLinkStatusLabel } from '../model/stay-link-model';
import { StayLinkConfirmation } from './StayLinkConfirmation';
import { StayLinkReceipt } from './StayLinkReceipt';
import '../styles/stay-link.css';

export function StayLinkCard({ stay, token, rejectSession, registerGuard, onReloadStay, navigationPending }: {
  stay: AdminStayDto;
  token: string;
  rejectSession: (token: string) => void;
  registerGuard: (guard: StayLinkNavigationGuard | null) => void;
  onReloadStay: () => void;
  navigationPending: boolean;
}) {
  const link = useStayLink(stay, token, rejectSession);
  const title = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const [confirmation, setConfirmation] = useState<{
    action: StayLinkAction;
    status: AdminStayLinkStatus;
  } | null>(null);
  const { resource, mutation, receipt, isBusy, hasReceipt } = link;
  useLayoutEffect(() => {
    registerGuard({ isBusy, hasReceipt });
  }, [registerGuard, isBusy, hasReceipt, mutation.busy, receipt, resource.status]);
  useLayoutEffect(() => () => registerGuard(null), [registerGuard]);

  function closeConfirmation() {
    setConfirmation(null);
    requestAnimationFrame(() => heading.current?.focus());
  }
  const current = resource.status === 'ready' ? resource.data : null;
  const confirming = current && confirmation && sameStayLinkStatus(current, confirmation.status)
    && !mutation.busy && !mutation.blocked && !navigationPending ? confirmation : null;

  return (
    <section className="stay-card stay-link" aria-labelledby={title} aria-busy={resource.status === 'loading' || mutation.busy}>
      <div className="stay-link__heading">
        <h2 id={title} ref={heading} tabIndex={-1}>개인 이용 링크</h2>
        <Button className="admin-button-secondary" disabled={navigationPending || mutation.busy || resource.status === 'loading' || !!confirming}
          onClick={() => { setConfirmation(null); void link.refresh(); }}>링크 상태 새로고침</Button>
      </div>
      <p>이 이용 일정에만 접근할 수 있는 개인 링크입니다.</p>
      {resource.status === 'loading' && <p role="status">개인 이용 링크 상태를 불러오는 중입니다.</p>}
      {resource.status === 'error' && (
        <div className="stay-banner stay-banner--error" role="alert">
          <p>{resource.message}</p>
          {resource.needsStayRefresh && <Button className="admin-button-secondary" disabled={navigationPending} onClick={onReloadStay}>이용 일정 다시 불러오기</Button>}
        </div>
      )}
      {current && <>
        <dl className="stay-link__details">
          <div><dt>링크 상태</dt><dd>{mutation.blocked ? '확인 필요 · 상태 새로고침' : stayLinkStatusLabel(current, stay)}</dd></div>
          <div><dt>유효기간 · 한국 시간</dt><dd>{current.expiresAt
            ? <time dateTime={current.expiresAt}>{formatStayLinkTimestamp(current.expiresAt)}</time> : '—'}</dd></div>
          <div><dt>최근 발급·폐기</dt><dd>{current.updatedAt
            ? <time dateTime={current.updatedAt}>{formatStayLinkTimestamp(current.updatedAt)}</time> : '—'}</dd></div>
        </dl>
        {!confirming && <div className="stay-link__actions">
          <Button disabled={navigationPending || mutation.busy || mutation.blocked || !canIssueStayLink(stay, current)}
            onClick={() => setConfirmation({ action: 'issue', status: current })}>
            {current.issued ? '새 링크로 교체' : '개인 링크 발급'}
          </Button>
          {current.issued && <Button className="admin-button-secondary"
            disabled={navigationPending || mutation.busy || mutation.blocked || !canRevokeStayLink(current)}
            onClick={() => setConfirmation({ action: 'revoke', status: current })}>링크 폐기</Button>}
        </div>}
        {!canIssueStayLink(stay, current) && <p className="stay-link__help">
          취소된 일정, 비활성 휴양소, 발급 가능 기간이 지난 일정에는 링크를 발급할 수 없습니다.
          상태가 변경되었다면 최신 이용 일정을 다시 확인해 주세요.
        </p>}
        {current.issued && !receipt && !mutation.busy && !mutation.blocked && !confirming && <p className="stay-link__help">
          이전에 발급한 주소는 다시 조회할 수 없습니다.
          {canIssueStayLink(stay, current) && ' 보관한 주소가 없으면 새 링크로 교체해 주세요.'}
        </p>}
      </>}
      {confirming && <StayLinkConfirmation action={confirming.action} replacing={confirming.status.issued}
        stay={stay} onCancel={closeConfirmation} onConfirm={() => {
          setConfirmation(null);
          void link.mutate(confirming.action, confirming.status);
        }} />}
      {mutation.busy && <p role="status">링크 요청을 처리하는 중입니다. 잠시 기다려 주세요.</p>}
      {mutation.message && !confirming && <div className={`stay-banner stay-banner--${mutation.tone === 'success' ? 'success' : 'error'}`}
        role={mutation.tone === 'success' ? 'status' : 'alert'}>{mutation.message}</div>}
      {receipt && !confirming && <StayLinkReceipt key={receipt.version} receipt={receipt} />}
      <p className="stay-link__help">
        이용객 정보·예정 날짜·관리자 메모 등 일정을 수정하면 기존 링크가 무효화됩니다.
        취소한 일정을 복원해도 새 링크가 필요합니다. 링크의 유효기간은 퇴실 예정 시각부터 7일 후까지입니다.
      </p>
      <p className="stay-link__help">이용객용 화면은 준비 중입니다. 실제 이용객 안내는 해당 화면이 완성된 후 진행해 주세요.</p>
    </section>
  );
}
