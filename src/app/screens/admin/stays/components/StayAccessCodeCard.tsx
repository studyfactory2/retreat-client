import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { stayAccessVersions } from '../../../../features/admin-stay-access/admin-stay-access-api';
import type {
  SaveStayAccessInput,
  StayCodeMethod,
} from '../../../../features/admin-stay-access/admin-stay-access.types';
import type { AdminStayDto } from '../../../../features/admin-stays/admin-stays.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { useAdminNavigationGuard } from '../../hooks/use-admin-navigation-guard';
import { useStayAccess } from '../hooks/use-stay-access';
import type { StayLinkNavigationGuard } from '../hooks/use-stay-link-navigation';
import {
  formatStayCodeTime,
  stayCodeBlockLabel,
  stayCodeMethodLabel,
  stayCodeReviewLabel,
} from '../model/stay-access-model';
import { StayAccessCodeReview } from './StayAccessCodeReview';
import '../styles/stay-access.css';

export function StayAccessCodeCard({
  stay,
  token,
  rejectSession,
  actionsDisabled,
  onInteractionChange,
  onReloadStay,
  onSummaryChange,
  registerGuard,
}: {
  stay: AdminStayDto;
  token: string;
  rejectSession: (token: string) => void;
  actionsDisabled: boolean;
  onInteractionChange: (busy: boolean) => void;
  onReloadStay: () => void;
  onSummaryChange?: (summary: string) => void;
  registerGuard?: (guard: StayLinkNavigationGuard | null) => void;
}) {
  const access = useStayAccess(stay, token, rejectSession);
  const [editing, setEditing] = useState(false);
  const [method, setMethod] = useState<StayCodeMethod>('AUTO');
  const [review, setReview] = useState<SaveStayAccessInput | null>(null);
  const title = useId();
  const choices = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const requestInFlight = useRef(false);
  const {
    resource,
    busy,
    revealing,
    blocked,
    secret,
    message,
    hasPendingRequest,
  } = access;
  const current = resource.status === 'ready' ? resource.data : null;
  const statusLabel =
    resource.status === 'loading'
      ? '불러오는 중'
      : resource.status === 'error' || blocked
        ? '상태 확인 필요'
        : current?.blockedReason === 'CANCELLED'
          ? '취소된 예약'
          : current?.blockedReason === 'ENDED'
            ? '종료된 예약'
            : current?.blockedReason
              ? '설정 확인 필요'
              : current?.state === 'PREPARED'
                ? '번호 준비됨'
                : current?.state === 'REVIEW_REQUIRED'
                  ? '확인 필요'
                  : '준비 전';
  useEffect(() => {
    onSummaryChange?.(statusLabel);
  }, [onSummaryChange, statusLabel]);
  const locked = busy || revealing || !!review || editing;
  useLayoutEffect(() => {
    onInteractionChange(locked);
  }, [locked, onInteractionChange]);
  useLayoutEffect(
    () => () => onInteractionChange(false),
    [onInteractionChange],
  );
  useLayoutEffect(() => {
    registerGuard?.({
      isBusy: () => requestInFlight.current || busy || revealing,
      hasReceipt: () => false,
      hasPendingChanges: () => !!review || editing || hasPendingRequest(),
    });
  }, [registerGuard, busy, revealing, review, editing, hasPendingRequest]);
  useLayoutEffect(() => () => registerGuard?.(null), [registerGuard]);
  useAdminNavigationGuard(() => !!review || editing || hasPendingRequest());
  const fixed = current?.propertySettings.roomMode === 'FIXED';
  const selectedMethod = fixed ? 'FIXED' : method;
  const disabled = actionsDisabled || busy || revealing || blocked;
  const selectVisible =
    current &&
    !current.blockedReason &&
    !review &&
    !busy &&
    (!current.code || editing);

  function focusHeading() {
    requestAnimationFrame(() =>
      heading.current?.focus({ preventScroll: true }),
    );
  }
  function runRequest(request: () => Promise<void>) {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    void request().finally(() => {
      requestInFlight.current = false;
    });
  }
  function prepareReview(keep = false) {
    if (!current || disabled || current.blockedReason) return;
    if (keep && !current.canConfirm) return;
    if (!keep && selectedMethod === 'PHONE_LAST6' && !current.phoneEligible)
      return;
    access.hide();
    setReview(
      keep
        ? { ...stayAccessVersions(current), action: 'CONFIRM' }
        : {
            ...stayAccessVersions(current),
            action: current.code ? 'REPLACE' : 'PREPARE',
            method: selectedMethod,
          },
    );
  }

  return (
    <section
      className="stay-card stay-access"
      aria-labelledby={title}
      aria-busy={resource.status === 'loading' || busy || revealing}
    >
      <div className="stay-access__heading">
        <div>
          <h2 id={title} ref={heading} tabIndex={-1}>
            예약 비밀번호
          </h2>
        </div>
        {current && (
          <span
            className={`stay-access__badge${current.state === 'PREPARED' && !blocked && !current.blockedReason ? ' stay-access__badge--ready' : current.state === 'REVIEW_REQUIRED' || blocked ? ' stay-access__badge--review' : ''}`}
          >
            {statusLabel}
          </span>
        )}
      </div>
      {resource.status === 'loading' && (
        <p className="stay-access__loading" role="status">
          번호 상태를 불러오는 중입니다.
        </p>
      )}
      {resource.status === 'error' && (
        <div
          className="stay-access__notice stay-access__notice--error"
          role="alert"
        >
          <p>{resource.message}</p>
          <Button
            className="admin-button-secondary"
            disabled={actionsDisabled}
            onClick={
              resource.needsStayRefresh
                ? onReloadStay
                : () => void access.refresh()
            }
          >
            {resource.needsStayRefresh
              ? '이용 일정 다시 불러오기'
              : '다시 불러오기'}
          </Button>
        </div>
      )}
      {current && !review && (
        <>
          {current.code && (
            <div className="stay-access__saved">
              <div className="stay-access__number">
                <span
                  className={`stay-access__digits${secret ? ' stay-access__digits--visible' : ''}`}
                  aria-label={secret ? '예약 비밀번호' : '숨겨진 예약 비밀번호'}
                >
                  {secret ?? '••••••'}
                </span>
                <div className="stay-access__number-actions">
                  <Button
                    className="admin-button-secondary"
                    aria-label={
                      secret ? '예약 비밀번호 숨기기' : '예약 비밀번호 보기'
                    }
                    loading={revealing}
                    disabled={
                      (disabled && !revealing) ||
                      busy ||
                      !!review ||
                      actionsDisabled
                    }
                    onClick={() =>
                      secret ? access.hide() : runRequest(access.reveal)
                    }
                  >
                    {secret ? '숨기기' : '보기'}
                  </Button>
                  {current.state === 'PREPARED' &&
                    !current.blockedReason &&
                    !editing &&
                    !busy && (
                      <Button
                        className="admin-button-secondary"
                        aria-label="번호 변경"
                        disabled={disabled}
                        onClick={() => {
                          access.hide();
                          setMethod('AUTO');
                          setEditing(true);
                        }}
                      >
                        변경
                      </Button>
                    )}
                </div>
              </div>
              <div className="stay-access__meta">
                <strong>{stayCodeMethodLabel[current.code.method]}</strong>
                {current.code.phoneMatchesCurrent === false && (
                  <span>연락처 변경 전 번호 유지</span>
                )}
                <time dateTime={current.code.updatedAt}>
                  {formatStayCodeTime(current.code.updatedAt)} · 한국 시간
                </time>
              </div>
              {secret && (
                <p className="stay-access__conceal" role="status">
                  30초 후 자동으로 숨겨집니다.
                </p>
              )}
            </div>
          )}
          {current.blockedReason && (
            <div className="stay-access__notice">
              <p>{stayCodeBlockLabel[current.blockedReason]}</p>
              {['PROPERTY_UNCONFIGURED', 'FIXED_CODE_MISSING'].includes(
                current.blockedReason,
              ) && (
                <Link
                  className="stay-access__settings"
                  to={`/admin/properties/${stay.property.id}/access-settings`}
                >
                  출입 비밀번호 설정 →
                </Link>
              )}
            </div>
          )}
          {current.reviewReasons.length > 0 && (
            <div className="stay-access__notice stay-access__notice--review">
              <ul>
                {current.reviewReasons.map((reason) => (
                  <li key={reason}>{stayCodeReviewLabel[reason]}</li>
                ))}
              </ul>
              <p>저장된 번호는 자동으로 바뀌지 않습니다.</p>
            </div>
          )}
          {selectVisible && (
            <div className="stay-access__prepare">
              {fixed ? (
                <p className="stay-access__fixed">
                  휴양소에 등록된 고정 번호를 사용합니다.
                </p>
              ) : (
                <fieldset className="stay-access__methods" disabled={disabled}>
                  <legend>번호 설정 방식</legend>
                  <label className={method === 'AUTO' ? 'is-selected' : ''}>
                    <input
                      type="radio"
                      name={choices}
                      value="AUTO"
                      checked={method === 'AUTO'}
                      onChange={() => setMethod('AUTO')}
                    />
                    <span>
                      <strong>자동 생성</strong>
                    </span>
                  </label>
                  <label
                    className={`${method === 'PHONE_LAST6' ? 'is-selected' : ''}${!current.phoneEligible ? ' is-disabled' : ''}`}
                  >
                    <input
                      type="radio"
                      name={choices}
                      value="PHONE_LAST6"
                      checked={method === 'PHONE_LAST6'}
                      disabled={!current.phoneEligible}
                      onChange={() => setMethod('PHONE_LAST6')}
                    />
                    <span>
                      <strong>휴대폰 뒤 6자리</strong>
                    </span>
                  </label>
                </fieldset>
              )}
              {!fixed && !current.phoneEligible && (
                <p className="stay-access__hint">
                  사용 가능한 연락처가 없습니다. 자동 생성을 이용해 주세요.
                </p>
              )}
              <div className="stay-access__actions">
                {editing && (
                  <Button
                    className="admin-button-secondary"
                    disabled={busy || revealing || actionsDisabled}
                    onClick={() => {
                      setEditing(false);
                      focusHeading();
                    }}
                  >
                    취소
                  </Button>
                )}
                <Button
                  disabled={
                    disabled ||
                    (selectedMethod === 'PHONE_LAST6' && !current.phoneEligible)
                  }
                  onClick={() => prepareReview()}
                >
                  {current.code ? '변경 내용 확인' : '번호 준비'}
                </Button>
              </div>
            </div>
          )}
          {current.code &&
            current.state === 'REVIEW_REQUIRED' &&
            !current.blockedReason &&
            !editing &&
            !busy && (
              <div className="stay-access__actions stay-access__manage">
                {current.canConfirm && (
                  <Button
                    disabled={disabled}
                    onClick={() => prepareReview(true)}
                  >
                    기존 번호 유지
                  </Button>
                )}
                <Button
                  className="admin-button-secondary"
                  disabled={disabled}
                  onClick={() => {
                    access.hide();
                    setMethod('AUTO');
                    setEditing(true);
                  }}
                >
                  번호 변경
                </Button>
              </div>
            )}
        </>
      )}
      {review && (
        <StayAccessCodeReview
          input={review}
          onCancel={() => {
            setReview(null);
            focusHeading();
          }}
          onSave={() => {
            const input = review;
            setReview(null);
            setEditing(false);
            runRequest(() => access.save(input));
            focusHeading();
          }}
        />
      )}
      {busy && (
        <p className="stay-access__loading" role="status">
          번호를 저장하고 있습니다.
        </p>
      )}
      {message && !review && (
        <div
          className={`stay-access__notice${message.success ? ' stay-access__notice--success' : ' stay-access__notice--error'}`}
          role={message.success ? 'status' : 'alert'}
        >
          <p>{message.text}</p>
          {blocked && (
            <Button
              className="admin-button-secondary"
              disabled={actionsDisabled || busy || revealing}
              onClick={() => {
                setEditing(false);
                setReview(null);
                void access.refresh();
              }}
            >
              최신 상태 불러오기
            </Button>
          )}
        </div>
      )}
      {current && !review && !busy && (
        <div className="stay-access__footer">
          <p>실제 도어락은 직원이 현장에서 변경합니다.</p>
          <Button
            className="admin-button-secondary stay-access__refresh"
            disabled={actionsDisabled || revealing || editing}
            onClick={() => {
              setReview(null);
              void access.refresh();
            }}
            aria-label="예약 비밀번호 상태 새로고침"
          >
            새로고침
          </Button>
        </div>
      )}
      {current && current.history.length > 0 && !review && (
        <details className="stay-access__history">
          <summary>최근 변경 이력</summary>
          <ol>
            {current.history.map((entry) => (
              <li key={entry.version}>
                <div>
                  <strong>
                    {entry.action === 'PREPARED'
                      ? '번호 준비'
                      : entry.action === 'REPLACED'
                        ? '번호 변경'
                        : '기존 번호 유지'}
                  </strong>
                  <span>{stayCodeMethodLabel[entry.method]}</span>
                </div>
                <p>
                  {entry.actorName} ·{' '}
                  <time dateTime={entry.createdAt}>
                    {formatStayCodeTime(entry.createdAt)}
                  </time>
                </p>
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}
