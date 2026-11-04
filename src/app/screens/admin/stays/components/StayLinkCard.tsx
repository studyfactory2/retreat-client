import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { AdminStayDto } from '../../../../features/admin-stays/admin-stays.types';
import type {
  AdminStayLinkStatus,
  StayLinkAction,
} from '../../../../features/admin-stay-links/admin-stay-link.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { useStayLink } from '../hooks/use-stay-link';
import type { StayLinkNavigationGuard } from '../hooks/use-stay-link-navigation';
import {
  canIssueStayLink,
  canRevokeStayLink,
  formatStayLinkTimestamp,
  sameStayLinkStatus,
  stayLinkStatusLabel,
} from '../model/stay-link-model';
import { StayLinkConfirmation } from './StayLinkConfirmation';
import { StayLinkReceipt } from './StayLinkReceipt';
import '../styles/stay-link.css';

export function StayLinkCard({
  stay,
  token,
  rejectSession,
  registerGuard,
  onReloadStay,
  navigationPending,
  onSummaryChange,
}: {
  stay: AdminStayDto;
  token: string;
  rejectSession: (token: string) => void;
  registerGuard: (guard: StayLinkNavigationGuard | null) => void;
  onReloadStay: () => void;
  navigationPending: boolean;
  onSummaryChange?: (summary: string) => void;
}) {
  const link = useStayLink(stay, token, rejectSession);
  const title = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const [confirmation, setConfirmation] = useState<{
    action: StayLinkAction;
    status: AdminStayLinkStatus;
  } | null>(null);
  const { resource, mutation, receipt, isBusy, hasReceipt, hasPendingChanges } =
    link;
  useLayoutEffect(() => {
    registerGuard({
      isBusy,
      hasReceipt,
      hasPendingChanges: () => confirmation !== null || hasPendingChanges(),
    });
  }, [
    registerGuard,
    isBusy,
    hasReceipt,
    hasPendingChanges,
    mutation.busy,
    receipt,
    resource.status,
    confirmation,
  ]);
  useLayoutEffect(() => () => registerGuard(null), [registerGuard]);

  function closeConfirmation() {
    setConfirmation(null);
    requestAnimationFrame(() => heading.current?.focus());
  }
  const current = resource.status === 'ready' ? resource.data : null;
  const statusLabel =
    resource.status === 'loading'
      ? '불러오는 중'
      : resource.status === 'error' || mutation.blocked
        ? '상태 확인 필요'
        : current
          ? stayLinkStatusLabel(current, stay)
          : '상태 확인 필요';
  useEffect(() => {
    onSummaryChange?.(statusLabel);
  }, [onSummaryChange, statusLabel]);
  const confirming =
    current &&
    confirmation &&
    sameStayLinkStatus(current, confirmation.status) &&
    !mutation.busy &&
    !mutation.blocked &&
    !navigationPending
      ? confirmation
      : null;

  return (
    <section
      className="stay-card stay-link"
      aria-labelledby={title}
      aria-busy={
        resource.status === 'loading' || mutation.busy || link.reopening
      }
    >
      <div className="stay-link__heading">
        <div>
          <h2 id={title} ref={heading} tabIndex={-1}>
            개인 이용 링크
          </h2>
          {current && (
            <span
              className={`stay-link__status${current.enabled && !mutation.blocked ? ' stay-link__status--active' : ''}`}
            >
              {statusLabel}
            </span>
          )}
        </div>
        <Button
          className="admin-button-secondary"
          aria-label="링크 상태 새로고침"
          disabled={
            navigationPending ||
            mutation.busy ||
            resource.status === 'loading' ||
            !!confirming
          }
          onClick={() => {
            setConfirmation(null);
            void link.refresh();
          }}
        >
          새로고침
        </Button>
      </div>
      {resource.status === 'loading' && (
        <p role="status">개인 이용 링크 상태를 불러오는 중입니다.</p>
      )}
      {resource.status === 'error' && (
        <div className="stay-banner stay-banner--error" role="alert">
          <p>{resource.message}</p>
          {resource.needsStayRefresh && (
            <Button
              className="admin-button-secondary"
              disabled={navigationPending}
              onClick={onReloadStay}
            >
              이용 일정 다시 불러오기
            </Button>
          )}
        </div>
      )}
      {current && (
        <>
          {current.expiresAt && (
            <dl className="stay-link__details">
              <div>
                <dt>링크 이용 기한 · 한국 시간</dt>
                <dd>
                  {current.expiresAt ? (
                    <time dateTime={current.expiresAt}>
                      {formatStayLinkTimestamp(current.expiresAt)}
                    </time>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
            </dl>
          )}
          {!confirming && !receipt && (
            <div className="stay-link__actions">
              {current.issued && current.canReopen ? (
                <Button
                  loading={link.reopening}
                  disabled={
                    navigationPending ||
                    mutation.busy ||
                    mutation.blocked ||
                    !current.enabled
                  }
                  onClick={() => void link.reopen()}
                >
                  QR · 링크 보기
                </Button>
              ) : (
                !current.issued && (
                  <Button
                    disabled={
                      navigationPending ||
                      mutation.busy ||
                      mutation.blocked ||
                      link.reopening ||
                      !canIssueStayLink(stay, current)
                    }
                    onClick={() =>
                      setConfirmation({ action: 'issue', status: current })
                    }
                  >
                    개인 링크 발급
                  </Button>
                )
              )}
            </div>
          )}
          {!confirming && current.issued && (
            <details className="stay-link__manage">
              <summary>링크 관리</summary>
              <div className="stay-link__actions">
                <Button
                  className="admin-button-secondary"
                  disabled={
                    navigationPending ||
                    mutation.busy ||
                    mutation.blocked ||
                    link.reopening ||
                    !canIssueStayLink(stay, current)
                  }
                  onClick={() =>
                    setConfirmation({ action: 'issue', status: current })
                  }
                >
                  새 링크로 교체
                </Button>
                <Button
                  className="admin-button-secondary stay-link__revoke"
                  disabled={
                    navigationPending ||
                    mutation.busy ||
                    mutation.blocked ||
                    link.reopening ||
                    !canRevokeStayLink(current)
                  }
                  onClick={() =>
                    setConfirmation({ action: 'revoke', status: current })
                  }
                >
                  링크 폐기
                </Button>
              </div>
            </details>
          )}
          {!canIssueStayLink(stay, current) && (
            <p className="stay-link__help">
              현재 일정 상태에서는 새 링크를 발급할 수 없습니다.
            </p>
          )}
          {current.issued &&
            !current.canReopen &&
            !receipt &&
            !mutation.busy &&
            !mutation.blocked &&
            !confirming && (
              <p className="stay-link__legacy">
                이전 방식으로 발급한 링크는 다시 조회할 수 없습니다.
                {current.enabled
                  ? ' 보관한 링크는 계속 사용할 수 있습니다.'
                  : ' 현재 링크는 이용할 수 없습니다.'}
                {canIssueStayLink(stay, current) &&
                  ' 필요하면 링크 관리에서 교체해 주세요.'}
              </p>
            )}
        </>
      )}
      {confirming && (
        <StayLinkConfirmation
          action={confirming.action}
          replacing={confirming.status.issued}
          stay={stay}
          onCancel={closeConfirmation}
          onConfirm={() => {
            setConfirmation(null);
            void link.mutate(confirming.action, confirming.status);
          }}
        />
      )}
      {mutation.busy && (
        <p role="status">링크 요청을 처리하는 중입니다. 잠시 기다려 주세요.</p>
      )}
      {mutation.message && !confirming && (
        <div
          className={`stay-banner stay-banner--${mutation.tone === 'success' ? 'success' : 'error'}`}
          role={mutation.tone === 'success' ? 'status' : 'alert'}
        >
          {mutation.message}
        </div>
      )}
      {link.reopenMessage && !confirming && (
        <p className="stay-banner stay-banner--error" role="alert">
          {link.reopenMessage}
        </p>
      )}
      {receipt && !confirming && (
        <StayLinkReceipt
          key={receipt.version}
          receipt={receipt}
          stay={stay}
          onClose={() => {
            link.hideReceipt();
            requestAnimationFrame(() =>
              heading.current?.focus({ preventScroll: true }),
            );
          }}
        />
      )}
      <details className="stay-link__rules">
        <summary>이용 기한 · 링크 안내</summary>
        <p>
          안내 링크는 퇴실 예정 시각부터 7일 후까지 이용할 수 있으며, 출입
          비밀번호는 퇴실 시 숨겨집니다. 일정 수정·취소, 링크 교체·폐기 시 기존
          링크는 사용할 수 없습니다. 취소한 일정을 복원해도 새 링크가
          필요합니다.
        </p>
        {current?.updatedAt && (
          <p>
            최근 변경 ·{' '}
            <time dateTime={current.updatedAt}>
              {formatStayLinkTimestamp(current.updatedAt)}
            </time>{' '}
            (한국 시간)
          </p>
        )}
      </details>
    </section>
  );
}
