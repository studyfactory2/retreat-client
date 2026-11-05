import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { ApiRequestError } from '../../../core/api/api-error';
import {
  getMessagePreview,
  getMessageSummary,
  getMessagingStatus,
  refreshMessage,
  sendMessage,
} from '../../../features/admin-messaging/admin-messaging-api';
import {
  messageStatusLabels,
  type MessageAttempt,
  type MessageDispatch,
  type MessageKind,
  type MessagePreview,
  type MessageSubject,
  type MessageSummary,
  type MessagingStatus,
} from '../../../features/admin-messaging/admin-messaging.types';

export function useAdminMessaging(
  subject: MessageSubject,
  token: string,
  rejectSession: (token: string) => void,
) {
  const { subjectType, subjectId } = subject;
  const [status, setStatus] = useState<MessagingStatus | null>(null);
  const [summary, setSummary] = useState<MessageSummary | null>(null);
  const [kind, setKind] = useState<MessageKind | ''>('');
  const [preview, setPreview] = useState<MessagePreview | null>(null);
  const [pending, setPending] = useState<
    'load' | 'preview' | 'send' | 'refresh' | null
  >('load');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [attempt, setAttempt] = useState<MessageAttempt | null>(null);
  const unresolved = useRef<MessageAttempt | null>(null);
  const unresolvedId = useRef<string | null>(null);
  const lock = useRef(false);
  const controllers = useRef(new Set<AbortController>());
  const version = useRef(0);

  useLayoutEffect(() => {
    version.current += 1;
    lock.current = false;
    const requests = controllers.current;
    return () => {
      version.current += 1;
      for (const controller of requests) controller.abort();
      requests.clear();
      unresolved.current = null;
    };
  }, [token, subjectType, subjectId]);

  const run = useCallback(
    async <T>(
      operation: 'load' | 'preview' | 'send' | 'refresh',
      action: (signal: AbortSignal) => Promise<T>,
      success: (value: T) => void,
      failed?: (error: unknown) => void,
    ) => {
      if (lock.current) return;
      lock.current = true;
      const owner = version.current;
      const controller = new AbortController();
      controllers.current.add(controller);
      setPending(operation);
      setError('');
      try {
        const result = await action(controller.signal);
        if (!controller.signal.aborted && owner === version.current)
          success(result);
      } catch (failure: unknown) {
        if (controller.signal.aborted || owner !== version.current) return;
        if (
          failure instanceof ApiRequestError &&
          [401, 403].includes(failure.status ?? 0)
        ) {
          rejectSession(token);
          setPreview(null);
          return;
        }
        setError(
          failure instanceof Error
            ? failure.message
            : '메시지를 확인하지 못했습니다.',
        );
        failed?.(failure);
      } finally {
        controllers.current.delete(controller);
        if (owner === version.current) {
          lock.current = false;
          setPending(null);
        }
      }
    },
    [token, rejectSession],
  );

  const load = useCallback(
    () =>
      run(
        'load',
        (signal) =>
          Promise.all([
            getMessagingStatus(token, signal),
            getMessageSummary(token, { subjectType, subjectId }, signal),
          ]),
        ([nextStatus, nextSummary]) => {
          setStatus(nextStatus);
          setSummary(nextSummary);
        },
      ),
    [run, token, subjectType, subjectId],
  );
  useEffect(() => {
    const owner = version.current;
    queueMicrotask(() => {
      if (owner === version.current) void load();
    });
  }, [load]);

  function updateDispatch(dispatch: MessageDispatch) {
    setSummary((current) =>
      current
        ? {
            ...current,
            history: [
              dispatch,
              ...current.history.filter((entry) => entry.id !== dispatch.id),
            ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
          }
        : current,
    );
  }
  function resolveAttempt(dispatch: MessageDispatch) {
    updateDispatch(dispatch);
    setNotice(messageStatusLabels[dispatch.status]);
    if (dispatch.status === 'UNKNOWN' || dispatch.status === 'SENDING') {
      unresolvedId.current = dispatch.id;
      return;
    }
    unresolved.current = null;
    unresolvedId.current = null;
    setAttempt(null);
    setPreview(null);
  }
  function submit(savedAttempt: MessageAttempt) {
    if (lock.current) return;
    // Keep exactly this attempt through timeouts and retries. Nothing is stored
    // in browser storage; request keys never contain phone numbers or credentials.
    unresolved.current = savedAttempt;
    setAttempt(savedAttempt);
    setNotice('');
    void run(
      'send',
      (signal) => sendMessage(token, subject, savedAttempt, signal),
      resolveAttempt,
      (failure) => {
        const knownConflict =
          failure instanceof ApiRequestError &&
          failure.status === 409 &&
          [
            'MESSAGE_PREVIEW_CHANGED',
            'MESSAGING_BLOCKED',
            'MESSAGE_REQUEST_KEY_CONFLICT',
            'MESSAGE_ALREADY_REQUESTED',
          ].includes(failure.code);
        const knownRejection =
          failure instanceof ApiRequestError &&
          failure.status !== null &&
          failure.status >= 400 &&
          failure.status < 500 &&
          (![408, 409].includes(failure.status) || knownConflict);
        if (knownRejection) {
          unresolved.current = null;
          setAttempt(null);
          setPreview(null);
        }
      },
    );
  }
  function select(nextKind: MessageKind | '') {
    if (lock.current || unresolved.current) return;
    setKind(nextKind);
    setPreview(null);
    setNotice('');
    if (!nextKind) return;
    void run(
      'preview',
      (signal) => getMessagePreview(token, subject, nextKind, signal),
      setPreview,
    );
  }
  return {
    status,
    summary,
    kind,
    preview,
    pending,
    error,
    notice,
    attempt,
    isBusy: () => lock.current,
    hasPendingAttempt: () => unresolved.current !== null,
    load: () => {
      if (!lock.current) {
        setPreview(null);
        setNotice('');
        void load();
      }
    },
    select,
    send: () => {
      if (
        !preview?.canSend ||
        !status?.enabled ||
        unresolved.current ||
        lock.current
      )
        return;
      submit({
        kind: preview.kind,
        previewKey: preview.previewKey,
        requestKey: crypto.randomUUID(),
      });
    },
    retry: () => {
      if (unresolved.current) submit(unresolved.current);
    },
    refresh: (dispatch: MessageDispatch) => {
      void run(
        'refresh',
        (signal) => refreshMessage(token, subject, dispatch.id, signal),
        (result) => {
          if (unresolvedId.current === result.id) resolveAttempt(result);
          else updateDispatch(result);
        },
      );
    },
  };
}
export type AdminMessagingModel = ReturnType<typeof useAdminMessaging>;
