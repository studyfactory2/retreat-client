import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import {
  getTaskPassword,
  revealTaskPassword,
} from '../../../../features/cleaning-tasks/cleaning-tasks-api';
import type {
  TaskConfirmation,
  TaskPasswordDto,
} from '../../../../features/cleaning-tasks/cleaning-tasks.types';

export function useTaskPassword(
  token: string,
  taskId: string | null,
  enabled: boolean,
  onAccessRejected: () => void,
) {
  const [revision, setRevision] = useState(0);
  const owner = useMemo(
    () => ({ token, taskId, enabled, revision }),
    [token, taskId, enabled, revision],
  );
  const [result, setResult] = useState<{
    owner: object;
    context: TaskPasswordDto | null;
    status: 'ready' | 'error';
    message: string;
  } | null>(null);
  const context = result?.owner === owner ? result.context : null;
  const status = result?.owner === owner ? result.status : 'loading';
  const message = result?.owner === owner ? result.message : '';
  const [approval, setApproval] = useState<{
    owner: object;
    guest: boolean;
    password: boolean;
  } | null>(null);
  const guestDeparted = approval?.owner === owner && approval.guest;
  const passwordChanged = approval?.owner === owner && approval.password;
  const setGuestDeparted = (value: boolean) =>
    setApproval({ owner, guest: value, password: passwordChanged });
  const setPasswordChanged = (value: boolean) =>
    setApproval({ owner, guest: guestDeparted, password: value });
  const [revealState, setRevealState] = useState<{
    owner: object;
    code: string | null;
    pending: boolean;
  } | null>(null);
  const code = revealState?.owner === owner ? revealState.code : null;
  const revealing = revealState?.owner === owner && revealState.pending;

  const active = useRef(false);
  const operation = useRef<AbortController | null>(null);
  const epoch = useRef(0);
  const callback = useRef(onAccessRejected);
  useLayoutEffect(() => {
    callback.current = onAccessRejected;
  }, [onAccessRejected]);
  const hide = useCallback(() => {
    epoch.current += 1;
    operation.current?.abort();
    operation.current = null;
    setRevealState(null);
  }, []);
  const refresh = useCallback(() => {
    hide();
    setApproval(null);
    setRevision((v) => v + 1);
  }, [hide]);
  useEffect(() => {
    active.current = enabled && taskId !== null;
    epoch.current += 1;
    operation.current?.abort();
    operation.current = null;

    if (!enabled || !taskId) return;
    const controller = new AbortController();

    void getTaskPassword(token, taskId, controller.signal).then(
      (value) => {
        if (!controller.signal.aborted && active.current) {
          setResult({ owner, context: value, status: 'ready', message: '' });
        }
      },
      (error: unknown) => {
        if (controller.signal.aborted || !active.current) return;
        if (
          error instanceof ApiRequestError &&
          [401, 403].includes(error.status ?? 0)
        )
          callback.current();
        setResult({
          owner,
          context: null,
          status: 'error',
          message:
            error instanceof Error
              ? error.message
              : '비밀번호 상태를 확인하지 못했습니다.',
        });
      },
    );
    return () => {
      active.current = false;
      controller.abort();
      epoch.current += 1;
      operation.current?.abort();
      operation.current = null;
    };
  }, [token, taskId, enabled, owner]);
  useEffect(() => {
    if (!enabled || !taskId) return;
    const leave = () => {
      hide();
      setApproval(null);
    };
    const resume = () => {
      if (document.visibilityState !== 'hidden') refresh();
    };
    const visibility = () =>
      document.visibilityState === 'hidden' ? leave() : resume();
    window.addEventListener('blur', leave);
    window.addEventListener('focus', resume);
    window.addEventListener('pagehide', leave);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('blur', leave);
      window.removeEventListener('focus', resume);
      window.removeEventListener('pagehide', leave);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [enabled, taskId, hide, refresh]);
  useEffect(() => {
    if (!code) return;
    const timer = window.setTimeout(hide, 30_000);
    return () => window.clearTimeout(timer);
  }, [code, hide]);
  async function reveal() {
    if (
      !active.current ||
      !context?.canComplete ||
      !context.requiresChange ||
      operation.current ||
      document.visibilityState === 'hidden'
    )
      return;
    if (code) {
      hide();
      return;
    }
    const controller = new AbortController();
    const generation = ++epoch.current;
    operation.current = controller;
    setRevealState({ owner, code: null, pending: true });
    setResult({ owner, context, status: 'ready', message: '' });
    try {
      const value = await revealTaskPassword(
        token,
        context.fingerprint,
        controller.signal,
      );
      if (
        active.current &&
        !controller.signal.aborted &&
        epoch.current === generation &&
        document.visibilityState === 'visible'
      )
        setRevealState({ owner, code: value, pending: false });
    } catch (error: unknown) {
      if (
        controller.signal.aborted ||
        !active.current ||
        epoch.current !== generation
      )
        return;
      if (
        error instanceof ApiRequestError &&
        [401, 403].includes(error.status ?? 0)
      )
        callback.current();
      setApproval(null);
      setResult({
        owner,
        context: null,
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : '비밀번호를 열지 못했습니다.',
      });
    } finally {
      if (operation.current === controller) {
        operation.current = null;
        setRevealState((current) =>
          current?.owner === owner ? { ...current, pending: false } : current,
        );
      }
    }
  }
  const confirmation = useMemo<TaskConfirmation | null>(
    () =>
      enabled &&
      context?.canComplete &&
      status === 'ready' &&
      guestDeparted &&
      (!context.requiresChange || passwordChanged)
        ? {
            fingerprint: context.fingerprint,
            guestDeparted: true,
            passwordChanged: context.requiresChange && passwordChanged,
          }
        : null,
    [enabled, context, status, guestDeparted, passwordChanged],
  );
  return {
    context,
    status,
    message,
    code,
    revealing,
    guestDeparted,
    passwordChanged,
    setGuestDeparted,
    setPasswordChanged,
    refresh,
    reveal,
    hide,
    confirmation,
  };
}
export type TaskPasswordController = ReturnType<typeof useTaskPassword>;
