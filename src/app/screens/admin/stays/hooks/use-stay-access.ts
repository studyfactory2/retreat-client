import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import {
  getStayAccess,
  revealStayAccess,
  saveStayAccess,
  stayAccessVersions,
} from '../../../../features/admin-stay-access/admin-stay-access-api';
import type {
  AdminStayAccessDto,
  SaveStayAccessInput,
} from '../../../../features/admin-stay-access/admin-stay-access.types';
import type { AdminStayDto } from '../../../../features/admin-stays/admin-stays.types';

type Resource =
  | { status: 'loading' }
  | { status: 'error'; message: string; needsStayRefresh: boolean }
  | { status: 'ready'; data: AdminStayAccessDto };
export function useStayAccess(
  stay: AdminStayDto,
  token: string,
  rejectSession: (token: string) => void,
) {
  const [resource, setResource] = useState<Resource>({ status: 'loading' });
  const [busy, setBusy] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [secret, setSecret] = useState<{ owner: string; value: string } | null>(
    null,
  );
  const [blocked, setBlocked] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    success: boolean;
  } | null>(null);
  const active = useRef(false);
  const owner = useRef<string | null>(token);
  const request = useRef<AbortController | null>(null);
  const revealRequest = useRef<AbortController | null>(null);
  const locked = useRef(false);
  const mutating = useRef(false);
  const hide = useCallback(() => {
    revealRequest.current?.abort();
    revealRequest.current = null;
    setRevealing(false);
    setSecret(null);
  }, []);
  const matchesStay = useCallback(
    (data: AdminStayAccessDto) =>
      data.stay.propertyId === stay.property.id &&
      data.stay.currentRevision === stay.currentRevision &&
      data.stay.status === stay.status &&
      data.stay.checkOutAt === stay.checkOutAt &&
      data.stay.propertyIsActive === stay.property.isActive,
    [
      stay.property.id,
      stay.property.isActive,
      stay.currentRevision,
      stay.status,
      stay.checkOutAt,
    ],
  );

  const refresh = useCallback(async () => {
    if (!active.current || owner.current !== token || mutating.current) return;
    hide();
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setResource({ status: 'loading' });
    setBusy(false);
    setMessage(null);
    try {
      const data = await getStayAccess(stay.id, token, controller.signal);
      if (
        !active.current ||
        owner.current !== token ||
        controller.signal.aborted ||
        request.current !== controller
      )
        return;
      if (!matchesStay(data)) {
        locked.current = true;
        setBlocked(true);
        setResource({
          status: 'error',
          message: '이용 일정이 변경되었습니다. 최신 일정을 불러와 주세요.',
          needsStayRefresh: true,
        });
        return;
      }
      locked.current = false;
      setBlocked(false);
      setResource({ status: 'ready', data });
    } catch (error) {
      if (
        !active.current ||
        owner.current !== token ||
        controller.signal.aborted ||
        request.current !== controller
      )
        return;
      if (
        error instanceof ApiRequestError &&
        [401, 403].includes(error.status ?? 0)
      )
        return rejectSession(token);
      setResource({
        status: 'error',
        message:
          error instanceof ApiRequestError
            ? error.message
            : '예약 비밀번호 상태를 불러오지 못했습니다.',
        needsStayRefresh: false,
      });
    } finally {
      if (request.current === controller) request.current = null;
    }
  }, [hide, stay.id, token, matchesStay, rejectSession]);

  useLayoutEffect(() => {
    active.current = true;
    owner.current = token;
    locked.current = false;
    mutating.current = false;
    return () => {
      active.current = false;
      owner.current = null;
      request.current?.abort();
      request.current = null;
      revealRequest.current?.abort();
      revealRequest.current = null;
    };
  }, [token]);
  useEffect(() => {
    const timeout = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timeout);
  }, [refresh]);
  useEffect(() => {
    const hidden = () => {
      if (document.visibilityState !== 'visible') hide();
    };
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('pagehide', hide);
    return () => {
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('pagehide', hide);
    };
  }, [hide]);
  useEffect(() => {
    if (secret === null) return;
    const timeout = window.setTimeout(hide, 30_000);
    return () => window.clearTimeout(timeout);
  }, [secret, hide]);

  async function reveal() {
    if (
      !active.current ||
      owner.current !== token ||
      resource.status !== 'ready' ||
      !resource.data.code ||
      request.current ||
      revealRequest.current ||
      locked.current
    )
      return;
    const current = resource.data;
    const method = current.code!.method;
    const controller = new AbortController();
    revealRequest.current = controller;
    setMessage(null);
    setRevealing(true);
    try {
      const code = await revealStayAccess(
        stay.id,
        stayAccessVersions(current),
        method,
        token,
        controller.signal,
      );
      if (
        !active.current ||
        owner.current !== token ||
        controller.signal.aborted ||
        revealRequest.current !== controller ||
        document.visibilityState !== 'visible'
      )
        return;
      setSecret({ owner: token, value: code });
    } catch (error) {
      if (
        !active.current ||
        owner.current !== token ||
        controller.signal.aborted ||
        revealRequest.current !== controller
      )
        return;
      if (
        error instanceof ApiRequestError &&
        [401, 403].includes(error.status ?? 0)
      )
        return rejectSession(token);
      const stale =
        error instanceof ApiRequestError &&
        (error.status === 409 || error.status === 404 || error.status === 200);
      if (stale) {
        locked.current = true;
        setBlocked(true);
      }
      setMessage({
        text: stale
          ? '정보가 변경되었습니다. 최신 상태를 불러와 주세요.'
          : '번호를 표시하지 못했습니다. 잠시 후 다시 시도해 주세요.',
        success: false,
      });
    } finally {
      if (revealRequest.current === controller) {
        revealRequest.current = null;
        setRevealing(false);
      }
    }
  }

  async function save(input: SaveStayAccessInput) {
    if (
      !active.current ||
      owner.current !== token ||
      request.current ||
      locked.current ||
      mutating.current ||
      revealRequest.current
    )
      return;
    hide();
    const controller = new AbortController();
    request.current = controller;
    mutating.current = true;
    setBusy(true);
    setMessage(null);
    try {
      const data = await saveStayAccess(
        stay.id,
        input,
        token,
        controller.signal,
      );
      if (
        !active.current ||
        owner.current !== token ||
        controller.signal.aborted ||
        request.current !== controller
      )
        return;
      if (!matchesStay(data))
        throw new ApiRequestError(
          '최신 상태를 확인해 주세요.',
          200,
          'INVALID_STAY_ACCESS_RESPONSE',
        );
      setResource({ status: 'ready', data });
      setMessage({
        text:
          input.action === 'CONFIRM'
            ? '기존 번호를 유지했습니다.'
            : '예약 비밀번호를 저장했습니다.',
        success: true,
      });
    } catch (error) {
      if (
        !active.current ||
        owner.current !== token ||
        controller.signal.aborted ||
        request.current !== controller
      )
        return;
      if (
        error instanceof ApiRequestError &&
        [401, 403].includes(error.status ?? 0)
      )
        return rejectSession(token);
      const uncertain =
        !(error instanceof ApiRequestError) ||
        error.status === null ||
        error.status >= 500 ||
        (error.status >= 200 && error.status < 300);
      // Refresh even after a rejected mutation so a second request always uses reviewed state.
      locked.current = true;
      setBlocked(true);
      setMessage({
        text: uncertain
          ? '저장 여부를 확인하지 못했습니다. 다시 저장하기 전에 최신 상태를 불러와 주세요.'
          : `${error.message} 최신 상태를 불러온 후 다시 확인해 주세요.`,
        success: false,
      });
    } finally {
      if (request.current === controller) {
        request.current = null;
        mutating.current = false;
        setBusy(false);
      }
    }
  }
  return {
    resource,
    busy,
    revealing,
    secret: secret?.owner === token ? secret.value : null,
    blocked,
    message,
    refresh,
    reveal,
    save,
    hide,
    hasPendingRequest: () => mutating.current || locked.current,
  };
}
