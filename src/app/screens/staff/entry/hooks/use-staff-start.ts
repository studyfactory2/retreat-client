import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { startStaffDraft } from '../../../../features/staff-drafts/staff-drafts-api';
import { getStaffQrContext } from '../../../../features/staff-entry/staff-entry-api';
import type { StaffQrContextDto } from '../../../../features/staff-entry/staff-entry.types';
import {
  createStaffStartState,
  sameStaffStartContext,
  staffStartConfigured,
  staffStartFailure,
  type StaffStartState,
} from '../model/staff-start-model';

type AccessStatus = 'ready' | 'checking' | 'error' | 'denied';
type StartRequest = { controller: AbortController; submitted: boolean };

export function useStaffStart(
  token: string | null,
  context: StaffQrContextDto | null,
  accessStatus: AccessStatus,
  refresh: () => void,
  rejectAccess: () => void,
) {
  const owner = useMemo(
    () => ({ token, initial: createStaffStartState() }),
    [token],
  );
  const scope = useRef<typeof owner | null>(owner);
  const environment = useRef({ context, accessStatus });
  const callbacks = useRef({ refresh, rejectAccess });
  const request = useRef<StartRequest | null>(null);
  const attempt = useRef<string | null>(null);
  const issued = useRef<string | null>(null);
  const lastContext = useRef<StaffQrContextDto | null>(null);
  const stateRef = useRef(owner.initial);
  const [result, setResult] = useState<{
    owner: typeof owner;
    state: StaffStartState;
  }>();
  const state = result?.owner === owner ? result.state : owner.initial;

  const publish = useCallback(
    (next: StaffStartState) => {
      if (scope.current !== owner) return;
      stateRef.current = next;
      setResult({ owner, state: next });
    },
    [owner],
  );

  const deny = useCallback(
    (notify: boolean) => {
      if (scope.current !== owner) return;
      request.current?.controller.abort();
      request.current = null;
      attempt.current = null;
      issued.current = null;
      lastContext.current = null;
      publish({ status: 'denied', confirmed: false, message: '' });
      if (notify) callbacks.current.rejectAccess();
    },
    [owner, publish],
  );

  useLayoutEffect(() => {
    scope.current = owner;
    stateRef.current = owner.initial;
    attempt.current = null;
    issued.current = null;
    lastContext.current = null;
    return () => {
      scope.current = null;
      request.current?.controller.abort();
      request.current = null;
    };
  }, [owner]);

  useLayoutEffect(() => {
    callbacks.current = { refresh, rejectAccess };
  }, [refresh, rejectAccess]);

  useLayoutEffect(() => {
    environment.current = { context, accessStatus };
    if (scope.current !== owner || token === null) return;
    const interrupted = request.current;
    interrupted?.controller.abort();
    request.current = null;
    if (accessStatus === 'denied') {
      deny(false);
      return;
    }
    if (interrupted) {
      publish({
        ...stateRef.current,
        status: interrupted.submitted ? 'uncertain' : 'idle',
        message: interrupted.submitted
          ? '접근 정보를 다시 확인하는 동안 시작 요청이 중단되었습니다. 서버에는 정비 기록이 만들어졌을 수 있지만 이어쓰기 링크를 확인하지 못했습니다. 자동으로 다시 시작하지 않습니다.'
          : '직원 안내를 다시 확인했습니다. 담당 직원을 확인한 뒤 시작해 주세요.',
      });
    }
    if (context) {
      if (stateRef.current.status === 'denied')
        publish(createStaffStartState());
      if (
        lastContext.current &&
        !sameStaffStartContext(lastContext.current, context)
      ) {
        publish({
          ...stateRef.current,
          confirmed: false,
          message:
            stateRef.current.status === 'uncertain'
              ? stateRef.current.message
              : '담당 직원이나 체크리스트가 변경되었습니다. 표시된 내용을 다시 확인해 주세요.',
        });
      }
      lastContext.current = context;
    }
  }, [owner, token, context, accessStatus, publish, deny]);

  function setConfirmed(value: boolean) {
    if (
      scope.current !== owner ||
      environment.current.accessStatus !== 'ready' ||
      request.current ||
      stateRef.current.status !== 'idle'
    )
      return;
    publish({ ...stateRef.current, confirmed: value, message: '' });
  }

  function openIssued() {
    if (
      scope.current !== owner ||
      environment.current.accessStatus !== 'ready' ||
      !issued.current
    )
      return;
    publish({
      ...stateRef.current,
      status: 'opening',
      message: '정비 기록을 만들었습니다. 개인 이어쓰기 화면으로 이동합니다.',
    });
    try {
      // This URL has already passed the feature's origin/path/token checks.
      window.location.assign(issued.current);
    } catch {
      publish({
        ...stateRef.current,
        status: 'opening',
        message:
          '정비 기록을 만들었지만 작성 화면을 열지 못했습니다. 아래 버튼으로 다시 열어 주세요.',
      });
    }
  }

  async function start() {
    const original = environment.current.context;
    if (
      scope.current !== owner ||
      !token ||
      !original ||
      environment.current.accessStatus !== 'ready' ||
      request.current ||
      stateRef.current.status !== 'idle' ||
      !staffStartConfigured(original)
    )
      return;
    if (!stateRef.current.confirmed) {
      publish({
        ...stateRef.current,
        message: '표시된 담당 직원을 확인해 주세요.',
      });
      return;
    }
    const active: StartRequest = {
      controller: new AbortController(),
      submitted: false,
    };
    request.current = active;
    const current = () =>
      scope.current === owner &&
      request.current === active &&
      !active.controller.signal.aborted &&
      environment.current.accessStatus === 'ready' &&
      environment.current.context === original;
    publish({ ...stateRef.current, status: 'checking', message: '' });
    try {
      const latest = await getStaffQrContext(token, active.controller.signal);
      if (!current()) return;
      const assignedStaff = latest.assignedStaff;
      if (
        !assignedStaff ||
        !staffStartConfigured(latest) ||
        !sameStaffStartContext(original, latest)
      ) {
        publish({
          status: 'idle',
          confirmed: false,
          message:
            '담당 직원이나 체크리스트가 변경되었습니다. 새로 불러온 내용을 확인한 뒤 시작해 주세요.',
        });
        request.current = null;
        callbacks.current.refresh();
        return;
      }
      attempt.current ??= crypto.randomUUID();
      publish({ ...stateRef.current, status: 'starting' });
      active.submitted = true;
      const receipt = await startStaffDraft(
        latest,
        {
          requestKey: attempt.current,
          confirmedStaffId: assignedStaff.id,
        },
        token,
        active.controller.signal,
      );
      if (!current()) return;
      issued.current = receipt.url;
      request.current = null;
      openIssued();
    } catch (error: unknown) {
      if (!current()) return;
      const failure = staffStartFailure(error, active.submitted);
      if (failure.kind === 'denied') {
        deny(true);
        return;
      }
      publish({
        ...stateRef.current,
        status: failure.kind === 'uncertain' ? 'uncertain' : 'idle',
        confirmed:
          failure.kind === 'configuration' ? false : stateRef.current.confirmed,
        message: failure.message,
      });
      if (failure.kind === 'configuration') {
        request.current = null;
        callbacks.current.refresh();
      }
    } finally {
      if (request.current === active) request.current = null;
    }
  }

  function prepareFresh() {
    if (
      scope.current !== owner ||
      environment.current.accessStatus !== 'ready' ||
      request.current ||
      stateRef.current.status !== 'uncertain'
    )
      return;
    if (
      !window.confirm(
        '이전에 만든 정비 기록이 남아 있을 수 있습니다. 이미 받은 이어쓰기 링크가 있다면 그 링크를 사용해 주세요. 별도의 새 정비 기록을 준비할까요?',
      )
    )
      return;
    if (scope.current !== owner || stateRef.current.status !== 'uncertain')
      return;
    attempt.current = null;
    publish({
      status: 'idle',
      confirmed: false,
      message:
        '별도의 새 정비 기록을 준비했습니다. 담당 직원을 확인하고 정비 시작을 눌러 주세요.',
    });
    callbacks.current.refresh();
  }

  useEffect(() => {
    const leave = () => {
      const active = request.current;
      if (scope.current !== owner || !active) return;
      active.controller.abort();
      request.current = null;
      publish({
        ...stateRef.current,
        status: active.submitted ? 'uncertain' : 'idle',
        message: active.submitted
          ? '화면을 벗어나는 동안 시작 요청이 중단되었습니다. 서버에 정비 기록이 만들어졌을 수 있습니다. 받은 이어쓰기 링크가 있는지 확인해 주세요.'
          : '직원 안내 확인이 중단되었습니다. 화면으로 돌아온 뒤 다시 시작해 주세요.',
      });
    };
    const visibilityChanged = () => {
      if (document.visibilityState === 'hidden') leave();
    };
    window.addEventListener('blur', leave);
    window.addEventListener('pagehide', leave);
    document.addEventListener('visibilitychange', visibilityChanged);
    return () => {
      window.removeEventListener('blur', leave);
      window.removeEventListener('pagehide', leave);
      document.removeEventListener('visibilitychange', visibilityChanged);
    };
  }, [owner, publish]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (
        scope.current !== owner ||
        !['checking', 'starting', 'uncertain'].includes(stateRef.current.status)
      )
        return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [owner]);

  const available =
    token !== null && accessStatus === 'ready' && context !== null;
  return {
    state,
    pending: state.status === 'checking' || state.status === 'starting',
    canConfirm:
      available && staffStartConfigured(context) && state.status === 'idle',
    canStart:
      available &&
      staffStartConfigured(context) &&
      state.status === 'idle' &&
      state.confirmed,
    setConfirmed,
    start,
    prepareFresh,
    openIssued,
  };
}
