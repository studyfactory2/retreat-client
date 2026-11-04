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
  getGuestAccessCodes,
  revealGuestAccessCode,
} from '../../../../features/guest-access-codes/guest-access-codes-api';
import { prepareGuestCodeCopy } from '../../../../features/guest-access-codes/guest-access-code-copy';
import type {
  GuestAccessCodeKind,
  GuestAccessCodesDto,
} from '../../../../features/guest-access-codes/guest-access-codes.types';
import type { GuestStayContextDto } from '../../../../features/guest-entry/guest-entry.types';

type Snapshot = {
  data: GuestAccessCodesDto;
  requestedAt: number;
  receivedAt: number;
  closesAt: number;
};
type Result = {
  owner: object;
  status: 'ready' | 'error';
  snapshot: Snapshot | null;
  message: string;
};
type Secret = {
  owner: object;
  kind: GuestAccessCodeKind;
  code: string;
  deadline: number;
};

// Use elapsed monotonic time anchored to server time. Subtract the entire
// request duration, conservatively hiding early instead of extending access
// when a response is slow or the device wall clock is incorrect.
function deadline(serverTime: string, until: string, requestedAt: number) {
  return requestedAt + Date.parse(until) - Date.parse(serverTime);
}

export function useGuestAccessCodes(
  token: string | null,
  context: GuestStayContextDto | null,
  rejectAccess: () => void,
) {
  const [revision, setRevision] = useState(0);
  const owner = useMemo(
    () => ({ token, context, revision }),
    [token, context, revision],
  );
  const scope = useRef<object | null>(owner);
  const operation = useRef<AbortController | null>(null);
  const epoch = useRef(0);
  const reject = useRef(rejectAccess);
  const [result, setResult] = useState<Result | null>(null);
  const [secret, setSecret] = useState<Secret | null>(null);
  const [pending, setPending] = useState<{
    owner: object;
    kind: GuestAccessCodeKind;
  } | null>(null);

  const hide = useCallback(() => {
    epoch.current += 1;
    operation.current?.abort();
    operation.current = null;
    setSecret(null);
    setPending(null);
  }, []);
  const refresh = useCallback(() => {
    if (scope.current !== owner || !owner.token || !owner.context) return;
    hide();
    setRevision((value) => value + 1);
  }, [hide, owner]);

  useLayoutEffect(() => {
    reject.current = rejectAccess;
  }, [rejectAccess]);
  useLayoutEffect(() => {
    scope.current = owner;
    epoch.current += 1;
    operation.current?.abort();
    operation.current = null;
    // Ownership immediately removes old values from render. Purge the old
    // in-memory payload before the next browser event without a nested render.
    queueMicrotask(() => {
      if (scope.current === owner) hide();
    });
    return () => {
      scope.current = null;
      epoch.current += 1;
      operation.current?.abort();
      operation.current = null;
    };
  }, [owner, hide]);

  useEffect(() => {
    if (!owner.token || !owner.context) return;
    const controller = new AbortController();
    const requestedAt = performance.now();
    const current = () => !controller.signal.aborted && scope.current === owner;
    void getGuestAccessCodes(
      {
        stayId: owner.context.stayId,
        propertyId: owner.context.property.id,
      },
      owner.token,
      controller.signal,
    ).then(
      (data) => {
        if (!current()) return;
        const receivedAt = performance.now();
        const closesAt = Math.min(
          deadline(data.serverTime, data.closesAt, requestedAt),
          deadline(data.serverTime, owner.context!.expiresAt, requestedAt),
        );
        setResult({
          owner,
          status: 'ready',
          snapshot: {
            data:
              closesAt <= receivedAt
                ? {
                    ...data,
                    state: 'ENDED',
                    entranceAvailable: false,
                    roomAvailable: false,
                    fingerprint: null,
                  }
                : data,
            requestedAt,
            receivedAt,
            closesAt,
          },
          message: '',
        });
      },
      (error: unknown) => {
        if (!current()) return;
        if (error instanceof ApiRequestError && error.status === 401)
          reject.current();
        setResult({
          owner,
          status: 'error',
          snapshot: null,
          message:
            error instanceof ApiRequestError && error.status === 429
              ? '잠시 후 다시 확인해 주세요.'
              : '비밀번호 정보를 불러오지 못했습니다.',
        });
      },
    );
    return () => controller.abort();
  }, [owner]);

  const currentResult = result?.owner === owner ? result : null;
  const snapshot = currentResult?.snapshot ?? null;
  const metadata = snapshot?.data ?? null;

  useEffect(() => {
    if (!snapshot || metadata?.state === 'ENDED') return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const now = performance.now();
      if (now >= snapshot.closesAt) {
        hide();
        setResult((previous) =>
          previous?.owner === owner && previous.snapshot
            ? {
                ...previous,
                snapshot: {
                  ...previous.snapshot,
                  data: {
                    ...previous.snapshot.data,
                    state: 'ENDED',
                    entranceAvailable: false,
                    roomAvailable: false,
                    fingerprint: null,
                  },
                },
                message: '',
              }
            : previous,
        );
        return;
      }
      // Opening may safely be late by one network round trip. Only a new
      // server response can authorize the AVAILABLE state.
      const opensAt =
        snapshot.receivedAt +
        Date.parse(snapshot.data.opensAt) -
        Date.parse(snapshot.data.serverTime);
      const next =
        snapshot.data.state === 'SCHEDULED'
          ? Math.min(snapshot.closesAt, opensAt + 100)
          : snapshot.closesAt;
      timer = setTimeout(
        () => {
          if (scope.current !== owner) return;
          if (
            snapshot.data.state === 'SCHEDULED' &&
            performance.now() >= opensAt &&
            performance.now() < snapshot.closesAt
          )
            refresh();
          else schedule();
        },
        Math.min(Math.max(0, next - now), 2_147_483_647),
      );
    };
    schedule();
    return () => clearTimeout(timer);
  }, [snapshot, metadata?.state, owner, refresh, hide]);

  useEffect(() => {
    if (!secret || secret.owner !== owner) return;
    const timer = setTimeout(
      hide,
      Math.max(0, secret.deadline - performance.now()),
    );
    return () => clearTimeout(timer);
  }, [secret, owner, hide]);

  useEffect(() => {
    if (!token || !context) return;
    let away = document.visibilityState === 'hidden';
    const leave = () => {
      away = true;
      hide();
    };
    const resume = () => {
      if (!away || document.visibilityState === 'hidden') return;
      away = false;
      refresh();
    };
    const visibility = () =>
      document.visibilityState === 'hidden' ? leave() : resume();
    const restored = (event: PageTransitionEvent) => {
      if (event.persisted) {
        away = false;
        refresh();
      }
    };
    window.addEventListener('blur', leave);
    window.addEventListener('focus', resume);
    window.addEventListener('pagehide', leave);
    window.addEventListener('pageshow', restored);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('blur', leave);
      window.removeEventListener('focus', resume);
      window.removeEventListener('pagehide', leave);
      window.removeEventListener('pageshow', restored);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [token, context, refresh, hide]);

  async function requestCode(kind: GuestAccessCodeKind, copy: boolean) {
    if (
      !owner.token ||
      !owner.context ||
      scope.current !== owner ||
      !snapshot ||
      snapshot.data.state !== 'AVAILABLE' ||
      operation.current ||
      document.visibilityState === 'hidden' ||
      (kind === 'ENTRANCE' && !snapshot.data.entranceAvailable)
    )
      return;
    if (performance.now() >= snapshot.closesAt) {
      refresh();
      return;
    }
    if (!copy && secret?.owner === owner && secret.kind === kind) {
      hide();
      return;
    }
    hide();
    const controller = new AbortController();
    const generation = ++epoch.current;
    const requestedAt = performance.now();
    const clipboard = copy ? prepareGuestCodeCopy() : null;
    operation.current = controller;
    setPending({ owner, kind });
    setResult((previous) =>
      previous?.owner === owner ? { ...previous, message: '' } : previous,
    );
    const current = () =>
      scope.current === owner &&
      operation.current === controller &&
      !controller.signal.aborted &&
      epoch.current === generation &&
      document.visibilityState !== 'hidden';
    try {
      // Copy also obtains a newly authorized value; stale displayed digits are
      // never copied after a reservation/code change or the disclosure cutoff.
      const data = await revealGuestAccessCode(
        snapshot.data,
        kind,
        owner.token,
        controller.signal,
      );
      if (!current()) return;
      const until = Math.min(
        deadline(data.serverTime, data.visibleUntil, requestedAt),
        snapshot.closesAt,
      );
      if (until <= performance.now()) {
        refresh();
        return;
      }
      setSecret({ owner, kind, code: data.code, deadline: until });
      if (clipboard) {
        const copied = await clipboard.write(data.code);
        if (current())
          setResult((previous) =>
            previous?.owner === owner
              ? {
                  ...previous,
                  message: copied
                    ? '비밀번호를 복사했습니다.'
                    : '번호를 길게 눌러 복사해 주세요.',
                }
              : previous,
          );
      }
    } catch (error: unknown) {
      if (!current()) return;
      hide();
      if (error instanceof ApiRequestError) {
        if (error.status === 401) {
          reject.current();
          return;
        }
        if (
          error.status === 409 ||
          error.code === 'GUEST_ACCESS_CODE_NOT_AVAILABLE'
        ) {
          refresh();
          return;
        }
      }
      setResult({
        owner,
        status: 'error',
        snapshot: null,
        message:
          error instanceof ApiRequestError && error.status === 429
            ? '잠시 후 다시 확인해 주세요.'
            : '비밀번호를 열지 못했습니다. 다시 확인해 주세요.',
      });
    } finally {
      clipboard?.cancel();
      if (operation.current === controller) {
        operation.current = null;
        setPending(null);
      }
    }
  }

  const visible =
    metadata?.state === 'AVAILABLE' && secret?.owner === owner ? secret : null;
  return {
    status: currentResult?.status ?? ('loading' as const),
    snapshot: metadata,
    message: currentResult?.message ?? '',
    codes: {
      ENTRANCE: visible?.kind === 'ENTRANCE' ? visible.code : null,
      ROOM: visible?.kind === 'ROOM' ? visible.code : null,
    },
    pendingKind: pending?.owner === owner ? pending.kind : null,
    refresh,
    reveal: (kind: GuestAccessCodeKind) => requestCode(kind, false),
    copy: (kind: GuestAccessCodeKind) => requestCode(kind, true),
    hide,
  };
}

export type GuestAccessCodesController = ReturnType<typeof useGuestAccessCodes>;
