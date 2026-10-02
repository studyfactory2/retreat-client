import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { GuestStayContextDto } from '../../../../features/guest-entry/guest-entry.types';
import {
  getGuestStayVehicle,
  saveGuestStayVehicle,
} from '../../../../features/guest-stay-vehicles/guest-stay-vehicle-api';
import {
  GUEST_VEHICLE_MAX_VERSION,
  normalizeGuestVehiclePlate,
  validateGuestVehiclePlate,
} from '../../../../features/guest-stay-vehicles/guest-stay-vehicle-validation';
import {
  createGuestVehicleState,
  guestVehicleDirty,
  guestVehicleFailure,
  sameGuestVehicleScope,
  sameGuestVehicleSnapshot,
  type GuestVehicleState,
} from '../model/guest-stay-vehicle-model';

export type GuestVehicleAccessStatus =
  'checking' | 'ready' | 'error' | 'denied';
type Request = {
  controller: AbortController;
  mode: 'read' | 'write';
  context: GuestStayContextDto;
};

export function useGuestStayVehicle(
  token: string | null,
  context: GuestStayContextDto | null,
  accessStatus: GuestVehicleAccessStatus,
  rejectAccess: () => void,
) {
  const owner = useMemo(
    () => ({ token, initial: createGuestVehicleState() }),
    [token],
  );
  const scope = useRef<typeof owner | null>(owner);
  const request = useRef<Request | null>(null);
  const environment = useRef({ context, accessStatus });
  const lastContext = useRef<GuestStayContextDto | null>(null);
  const reject = useRef(rejectAccess);
  const stateRef = useRef(owner.initial);
  const [result, setResult] = useState<{
    owner: typeof owner;
    state: GuestVehicleState;
  }>();
  const state = result?.owner === owner ? result.state : owner.initial;

  const publish = useCallback(
    (next: GuestVehicleState) => {
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
      lastContext.current = null;
      publish({
        ...createGuestVehicleState(),
        phase: 'denied',
        message:
          '이용 링크를 사용할 수 없습니다. 관리자에게 새 링크를 요청해 주세요.',
      });
      if (notify) reject.current();
    },
    [owner, publish],
  );

  useLayoutEffect(() => {
    scope.current = owner;
    stateRef.current = owner.initial;
    lastContext.current = null;
    return () => {
      scope.current = null;
      request.current?.controller.abort();
      request.current = null;
    };
  }, [owner]);
  useLayoutEffect(() => {
    reject.current = rejectAccess;
  }, [rejectAccess]);

  const reload = useCallback(async () => {
    const currentContext = environment.current.context;
    if (
      scope.current !== owner ||
      !token ||
      !currentContext ||
      environment.current.accessStatus !== 'ready' ||
      request.current?.mode === 'write' ||
      stateRef.current.phase === 'denied'
    )
      return;
    if (Date.parse(currentContext.expiresAt) <= Date.now()) {
      deny(true);
      return;
    }
    if (!currentContext.property.vehicleRegistrationEnabled) {
      publish({
        ...createGuestVehicleState(),
        phase: 'disabled',
        expiresAt: currentContext.expiresAt,
      });
      return;
    }
    request.current?.controller.abort();
    const active: Request = {
      controller: new AbortController(),
      mode: 'read',
      context: currentContext,
    };
    request.current = active;
    publish({
      ...stateRef.current,
      phase: 'loading',
      context: currentContext,
      expiresAt: currentContext.expiresAt,
      error: '',
      message: '',
    });
    const current = () =>
      scope.current === owner &&
      request.current === active &&
      !active.controller.signal.aborted &&
      environment.current.accessStatus === 'ready' &&
      environment.current.context === currentContext;
    try {
      const data = await getGuestStayVehicle(
        {
          stayId: currentContext.stayId,
          propertyId: currentContext.property.id,
        },
        token,
        active.controller.signal,
      );
      if (!current()) return;
      if (Date.parse(currentContext.expiresAt) <= Date.now()) {
        deny(true);
        return;
      }
      if (!data.enabled) {
        publish({
          ...createGuestVehicleState(),
          phase: 'disabled',
          expiresAt: currentContext.expiresAt,
        });
        return;
      }
      const previous = stateRef.current;
      const changed =
        previous.snapshot !== null &&
        !sameGuestVehicleSnapshot(previous.snapshot, data);
      const reviewRequired = previous.reviewRequired || changed;
      const dirty = guestVehicleDirty(previous);
      const becameHidden =
        data.needsConfirmation && !previous.snapshot?.needsConfirmation;
      const input = becameHidden
        ? ''
        : dirty
          ? previous.input
          : (data.plateNumber ?? '');
      publish({
        ...previous,
        phase: reviewRequired ? 'review' : 'ready',
        snapshot: data,
        input,
        baselinePlate:
          reviewRequired && !data.needsConfirmation
            ? previous.baselinePlate
            : (data.plateNumber ?? ''),
        reviewRequired,
        expiresAt: currentContext.expiresAt,
        error: '',
        message: reviewRequired
          ? previous.uncertain
            ? '최신 상태를 불러왔습니다. 이전 저장 요청의 성공 여부는 이 조회만으로 확인할 수 없습니다. 표시된 내용을 확인한 뒤 계속해 주세요.'
            : '최신 차량 정보가 변경되었습니다. 표시된 내용을 확인한 뒤 계속해 주세요.'
          : data.needsConfirmation
            ? '이용 정보가 변경되었습니다. 차량번호를 다시 입력하거나 명시적으로 비워 주세요.'
            : '',
      });
    } catch (error: unknown) {
      if (!current()) return;
      const failure = guestVehicleFailure(error);
      if (failure.kind === 'denied') {
        deny(true);
        return;
      }
      if (failure.kind === 'disabled') {
        publish({
          ...createGuestVehicleState(),
          phase: 'disabled',
          expiresAt: currentContext.expiresAt,
        });
        return;
      }
      publish({
        ...stateRef.current,
        phase: 'error',
        error:
          '차량 정보를 불러오지 못했습니다. 입력 내용은 유지됩니다. 다시 불러와 주세요.',
        message: '',
      });
    } finally {
      if (request.current === active) request.current = null;
    }
  }, [owner, token, publish, deny]);

  useLayoutEffect(() => {
    environment.current = { context, accessStatus };
    if (scope.current !== owner) return;
    const interrupted = request.current;
    interrupted?.controller.abort();
    request.current = null;
    if (!token) return;
    if (accessStatus === 'denied') {
      deny(false);
      return;
    }
    if (
      accessStatus === 'ready' &&
      context &&
      stateRef.current.phase === 'denied'
    ) {
      // Only a new parent context can restore denied access; the card's own
      // retry button cannot bypass the parent capability check.
      publish(createGuestVehicleState());
    }
    if (
      context &&
      lastContext.current &&
      !sameGuestVehicleScope(context, lastContext.current)
    ) {
      stateRef.current = createGuestVehicleState();
      publish(stateRef.current);
    } else if (interrupted?.mode === 'write') {
      publish({
        ...stateRef.current,
        phase: 'blocked',
        reviewRequired: true,
        uncertain: true,
        error: '',
        message:
          '접근 정보를 다시 확인하는 동안 저장 요청이 중단되었습니다. 저장되었을 수 있으므로 최신 내용을 확인해 주세요.',
      });
    } else if (interrupted?.mode === 'read' && accessStatus !== 'ready') {
      publish({ ...stateRef.current, phase: 'error', error: '', message: '' });
    }
    if (context) {
      lastContext.current = context;
      if (Date.parse(context.expiresAt) <= Date.now()) {
        deny(true);
        return;
      }
      if (!context.property.vehicleRegistrationEnabled) {
        publish({
          ...createGuestVehicleState(),
          phase: 'disabled',
          expiresAt: context.expiresAt,
        });
        return;
      }
    }
    if (accessStatus === 'ready' && context) void reload();
  }, [owner, token, context, accessStatus, reload, publish, deny]);

  function write(plateNumber: string | null) {
    const currentContext = environment.current.context;
    const previous = stateRef.current;
    if (
      scope.current !== owner ||
      !token ||
      !currentContext ||
      environment.current.accessStatus !== 'ready' ||
      request.current ||
      previous.phase !== 'ready' ||
      previous.reviewRequired ||
      !previous.snapshot?.enabled ||
      previous.snapshot.version >= GUEST_VEHICLE_MAX_VERSION
    )
      return;
    if (Date.parse(currentContext.expiresAt) <= Date.now()) {
      deny(true);
      return;
    }
    const error = validateGuestVehiclePlate(plateNumber);
    if (error) {
      publish({ ...previous, error, message: '' });
      return;
    }
    const normalized =
      plateNumber === null ? null : normalizeGuestVehiclePlate(plateNumber);
    if (
      !previous.snapshot.needsConfirmation &&
      normalized === previous.snapshot.plateNumber
    )
      return;
    const active: Request = {
      controller: new AbortController(),
      mode: 'write',
      context: currentContext,
    };
    request.current = active;
    publish({ ...previous, phase: 'saving', error: '', message: '' });
    const current = () =>
      scope.current === owner &&
      request.current === active &&
      !active.controller.signal.aborted &&
      environment.current.accessStatus === 'ready' &&
      environment.current.context === currentContext;
    void saveGuestStayVehicle(
      { stayId: currentContext.stayId, propertyId: currentContext.property.id },
      { expectedVersion: previous.snapshot.version, plateNumber: normalized },
      token,
      active.controller.signal,
    )
      .then(
        (saved) => {
          if (!current()) return;
          if (Date.parse(currentContext.expiresAt) <= Date.now()) {
            deny(true);
            return;
          }
          publish({
            ...previous,
            phase: 'ready',
            snapshot: saved,
            input: saved.plateNumber ?? '',
            baselinePlate: saved.plateNumber ?? '',
            reviewRequired: false,
            uncertain: false,
            error: '',
            message:
              normalized === null
                ? '저장된 차량번호를 비웠습니다.'
                : '차량번호를 저장했습니다.',
          });
        },
        (error: unknown) => {
          if (!current()) return;
          const failure = guestVehicleFailure(error);
          if (failure.kind === 'denied') {
            deny(true);
            return;
          }
          if (failure.kind === 'disabled') {
            publish({
              ...createGuestVehicleState(),
              phase: 'disabled',
              expiresAt: currentContext.expiresAt,
            });
            return;
          }
          publish({
            ...previous,
            phase: failure.kind === 'blocked' ? 'blocked' : 'ready',
            reviewRequired: failure.kind === 'blocked',
            uncertain: failure.uncertain,
            error: failure.message,
            message: '',
          });
        },
      )
      .finally(() => {
        if (request.current === active) request.current = null;
      });
  }

  function setPlate(value: string) {
    const previous = stateRef.current;
    if (
      scope.current !== owner ||
      environment.current.accessStatus !== 'ready' ||
      request.current ||
      previous.reviewRequired ||
      !['ready', 'error'].includes(previous.phase)
    )
      return;
    publish({ ...previous, input: value, error: '', message: '' });
  }
  function acknowledgeReview() {
    const previous = stateRef.current;
    if (
      scope.current !== owner ||
      environment.current.accessStatus !== 'ready' ||
      request.current ||
      previous.phase !== 'review' ||
      !previous.snapshot?.enabled
    )
      return;
    publish({
      ...previous,
      phase: 'ready',
      reviewRequired: false,
      uncertain: false,
      baselinePlate: previous.snapshot.plateNumber ?? '',
      error: '',
      message:
        '최신 내용을 확인했습니다. 필요한 변경 사항을 입력한 뒤 저장해 주세요.',
    });
  }

  const mustWarn = useCallback(() => {
    if (scope.current !== owner || !token) return false;
    const latest = stateRef.current;
    return (
      guestVehicleDirty(latest) ||
      latest.reviewRequired ||
      request.current?.mode === 'write'
    );
  }, [owner, token]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!mustWarn()) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [mustWarn]);

  useEffect(() => {
    if (state.expiresAt === null || state.phase === 'denied') return;
    const expiresAt = Date.parse(state.expiresAt);
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(
        () => {
          if (scope.current !== owner) return;
          if (expiresAt > Date.now()) schedule();
          else deny(true);
        },
        Math.min(Math.max(0, expiresAt - Date.now()), 2_147_483_647),
      );
    };
    schedule();
    return () => clearTimeout(timer);
  }, [owner, state.expiresAt, state.phase, deny]);

  const available =
    token !== null &&
    accessStatus === 'ready' &&
    context !== null &&
    state.context !== null &&
    sameGuestVehicleScope(context, state.context);
  const dirty = guestVehicleDirty(state);
  const pending = state.phase === 'loading' || state.phase === 'saving';
  const canEdit =
    available &&
    ['ready', 'error'].includes(state.phase) &&
    !state.reviewRequired &&
    !!state.snapshot?.enabled &&
    state.snapshot.version < GUEST_VEHICLE_MAX_VERSION;
  const canWrite = canEdit && state.phase === 'ready';
  return {
    phase: state.phase,
    snapshot:
      available && ['ready', 'review', 'saving'].includes(state.phase)
        ? state.snapshot
        : null,
    input: available && (state.phase !== 'loading' || dirty) ? state.input : '',
    error: state.error,
    message:
      state.message ||
      (available && state.snapshot?.version === GUEST_VEHICLE_MAX_VERSION
        ? '차량 정보의 변경 한도에 도달해 조회만 가능합니다. 수정이 필요하면 관리자에게 문의해 주세요.'
        : ''),
    pending,
    dirty,
    canEdit,
    canClear:
      canWrite &&
      !!state.snapshot &&
      (state.snapshot.plateNumber !== null || state.snapshot.needsConfirmation),
    canSave: canWrite && (dirty || !!state.snapshot?.needsConfirmation),
    setPlate,
    save: () => write(stateRef.current.input),
    clear: () => write(null),
    reload,
    acknowledgeReview,
    confirmLeave: () =>
      !mustWarn() ||
      window.confirm(
        request.current?.mode === 'write' || stateRef.current.uncertain
          ? '차량 정보 저장 결과가 확인되지 않았습니다. 지금 나가면 입력 내용과 확인 중인 결과를 잃을 수 있습니다. 나갈까요?'
          : '차량 정보에 저장하지 않았거나 다시 확인해야 할 내용이 있습니다. 이 화면에서 나갈까요?',
      ),
  };
}
