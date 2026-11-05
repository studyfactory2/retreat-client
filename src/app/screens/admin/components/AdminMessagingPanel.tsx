import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type {
  MessageSubject,
  MessageKind,
} from '../../../features/admin-messaging/admin-messaging.types';
import {
  messageKindLabels,
  messageStatusLabels,
} from '../../../features/admin-messaging/admin-messaging.types';
import { Button } from '../../../shared/ui/Button/Button';
import { useAdminMessaging } from '../hooks/use-admin-messaging';
import { useAdminNavigationGuard } from '../hooks/use-admin-navigation-guard';
import { MessageAutomationSummary } from './MessageAutomationSummary';
import { MessageHistory } from './MessageHistory';
import '../styles/admin-messaging.css';

type MessagingGuard = {
  isBusy: () => boolean;
  hasReceipt: () => boolean;
  hasPendingChanges: () => boolean;
};
type MessagingPanelProps = MessageSubject & {
  token: string;
  rejectSession: (token: string) => void;
  disabled?: boolean;
  registerGuard?: (guard: MessagingGuard | null) => void;
  onSummaryChange?: (summary: string) => void;
  onInteractionChange?: (busy: boolean, pending: boolean) => void;
};
export function AdminMessagingPanel(props: MessagingPanelProps) {
  // A replacement credential or subject gets fresh transient state. Keys are
  // confined to this React tree; nothing is persisted or emitted to telemetry.
  return (
    <MessagingPanelContent
      key={`${props.subjectType}:${props.subjectId}:${props.token}`}
      {...props}
    />
  );
}
function MessagingPanelContent({
  subjectType,
  subjectId,
  token,
  rejectSession,
  disabled = false,
  registerGuard,
  onSummaryChange,
  onInteractionChange,
}: MessagingPanelProps) {
  const model = useAdminMessaging(
    { subjectType, subjectId },
    token,
    rejectSession,
  );
  const [confirmation, setConfirmation] = useState(false);
  const id = useId();
  const confirmHeading = useRef<HTMLHeadingElement>(null);
  const sendButton = useRef<HTMLButtonElement>(null);
  const busy = model.pending !== null;
  const { isBusy, hasPendingAttempt, pending } = model;
  const hasPending = confirmation || model.attempt !== null;
  useAdminNavigationGuard(
    () => model.isBusy() || confirmation || model.hasPendingAttempt(),
  );
  useLayoutEffect(() => {
    registerGuard?.({
      isBusy,
      hasReceipt: () => false,
      hasPendingChanges: () => confirmation || hasPendingAttempt(),
    });
    onInteractionChange?.(pending === 'send', hasPending);
  }, [
    registerGuard,
    onInteractionChange,
    busy,
    hasPending,
    confirmation,
    isBusy,
    hasPendingAttempt,
    pending,
  ]);
  useLayoutEffect(
    () => () => {
      registerGuard?.(null);
      onInteractionChange?.(false, false);
    },
    [registerGuard, onInteractionChange],
  );
  const summary = !model.status
    ? '상태 확인'
    : !model.status.enabled
      ? '발송 꺼짐'
      : model.summary?.history[0]
        ? messageStatusLabels[model.summary.history[0].status]
        : '미리보기 · 발송';
  useEffect(() => onSummaryChange?.(summary), [onSummaryChange, summary]);
  useEffect(() => {
    if (confirmation) confirmHeading.current?.focus();
  }, [confirmation]);
  const preview = model.preview;
  const unresolvedHistory = model.summary?.history.some(
    (entry) =>
      entry.kind === model.kind &&
      ['SENDING', 'UNKNOWN'].includes(entry.status),
  );
  const canSend = !!(
    preview?.canSend &&
    model.status?.enabled &&
    !unresolvedHistory &&
    !model.attempt
  );
  const blocked = disabled || busy;
  function cancelConfirmation() {
    setConfirmation(false);
    requestAnimationFrame(() => sendButton.current?.focus());
  }
  return (
    <section
      className="admin-messaging"
      aria-label="안내 메시지"
      aria-busy={busy}
    >
      <div className="admin-messaging__toolbar">
        <span className="admin-messaging__channel">카카오 알림톡</span>
        <button
          type="button"
          disabled={blocked || confirmation}
          onClick={model.load}
        >
          새로고침
        </button>
      </div>
      {model.status && !model.status.enabled && (
        <p className="admin-messaging__status">
          현재 메시지 발송이 꺼져 있습니다.
        </p>
      )}
      {model.status?.enabled && !model.status.ready && (
        <p className="admin-messaging__status">
          {model.status.reasons[0]?.message ?? '발송 설정을 확인해 주세요.'}
        </p>
      )}
      {model.pending === 'load' && !model.summary && (
        <p className="admin-messaging__muted" role="status">
          안내 메시지를 불러오는 중입니다.
        </p>
      )}
      {model.error && (
        <p className="admin-messaging__warning" role="alert">
          {model.error}
        </p>
      )}
      {model.notice && !model.attempt && (
        <p className="admin-messaging__status" role="status">
          {model.notice}
        </p>
      )}
      {model.summary && (
        <>
          <div className="admin-messaging__kind">
            <label htmlFor={`${id}-kind`}>안내 종류</label>
            <select
              id={`${id}-kind`}
              value={model.kind}
              disabled={blocked || confirmation || !!model.attempt}
              onChange={(event) =>
                model.select(event.target.value as MessageKind | '')
              }
            >
              <option value="">선택해 주세요</option>
              {model.summary.availableKinds.map((kind) => (
                <option value={kind} key={kind}>
                  {messageKindLabels[kind]}
                </option>
              ))}
            </select>
          </div>
          {model.pending === 'preview' && (
            <p className="admin-messaging__muted" role="status">
              미리보기를 준비하고 있습니다.
            </p>
          )}
          {model.kind && !preview && !busy && !model.attempt && (
            <Button
              className="admin-button-secondary"
              disabled={disabled}
              onClick={() => model.select(model.kind)}
            >
              미리보기 다시 확인
            </Button>
          )}
          {preview && (
            <>
              <div className="admin-messaging__recipient">
                <span>받는 사람</span>
                <strong>{preview.recipient.name}</strong>
                <small>{preview.recipient.maskedPhone ?? '연락처 없음'}</small>
              </div>
              <div
                className="admin-messaging__preview"
                aria-label="발송 내용 미리보기"
              >
                <span>알림톡 미리보기</span>
                <p>{preview.body}</p>
                {preview.buttons.map((button, index) => (
                  <div
                    className="admin-messaging__preview-button"
                    key={`${button.label}:${index}`}
                  >
                    {button.label}
                  </div>
                ))}
              </div>
              {preview.blockers.length > 0 && (
                <div className="admin-messaging__blockers">
                  <p>{preview.blockers[0].message}</p>
                  {preview.blockers.length > 1 && (
                    <details>
                      <summary>준비 항목 {preview.blockers.length}개</summary>
                      <ul>
                        {preview.blockers.slice(1).map((item) => (
                          <li key={item.code}>{item.message}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}
              {preview.warnings.map((warning) => (
                <p className="admin-messaging__muted" key={warning}>
                  {warning}
                </p>
              ))}
              {unresolvedHistory && !model.attempt && (
                <p className="admin-messaging__warning">
                  이전 요청 결과를 먼저 확인해 주세요.
                </p>
              )}
              {!model.attempt && !confirmation && (
                <button
                  type="button"
                  ref={sendButton}
                  className="ui-button admin-messaging__send"
                  disabled={blocked || !canSend}
                  onClick={() => setConfirmation(true)}
                >
                  발송 내용 확인
                </button>
              )}
              {confirmation && (
                <div
                  className="admin-messaging__confirm"
                  role="group"
                  aria-labelledby={`${id}-confirm`}
                >
                  <h3 id={`${id}-confirm`} tabIndex={-1} ref={confirmHeading}>
                    이 안내를 발송할까요?
                  </h3>
                  <p>
                    {preview.recipient.name} · {preview.recipient.maskedPhone}
                    <br />
                    {preview.label}
                  </p>
                  <div>
                    <Button
                      className="admin-button-secondary"
                      disabled={blocked}
                      onClick={cancelConfirmation}
                    >
                      돌아가기
                    </Button>
                    <Button
                      disabled={blocked || !canSend}
                      onClick={() => {
                        setConfirmation(false);
                        model.send();
                      }}
                    >
                      발송 확인
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
          {model.attempt && (
            <div className="admin-messaging__uncertain" role="status">
              <strong>
                {model.pending === 'send'
                  ? '발송 요청을 확인하고 있습니다.'
                  : '결과확인필요'}
              </strong>
              {model.pending !== 'send' && (
                <>
                  <p>같은 요청으로 재시도해 중복 발송을 방지합니다.</p>
                  <Button
                    className="admin-button-secondary"
                    disabled={blocked}
                    onClick={model.retry}
                  >
                    같은 요청 다시 확인
                  </Button>
                </>
              )}
            </div>
          )}
          <MessageHistory
            history={model.summary.history}
            disabled={blocked || confirmation}
            canRefresh={!!model.status?.enabled}
            onRefresh={model.refresh}
          />
        </>
      )}
      <MessageAutomationSummary
        subjectType={subjectType}
        subjectId={subjectId}
        token={token}
        rejectSession={rejectSession}
      />
    </section>
  );
}
