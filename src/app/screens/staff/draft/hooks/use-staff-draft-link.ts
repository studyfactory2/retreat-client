import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { appConfig } from '../../../../core/config/environment';

export function useStaffDraftLink(
  token: string,
  expiresAt: string,
  disabled: boolean,
) {
  const owner = useMemo(
    () => ({ token, expiresAt, disabled }),
    [token, expiresAt, disabled],
  );
  const scope = useRef<typeof owner | null>(owner);
  const pending = useRef(false);
  const [result, setResult] = useState<{
    owner: typeof owner;
    state: 'copying' | 'copied' | 'manual' | 'expired';
  } | null>(null);
  useLayoutEffect(() => {
    scope.current = owner;
    pending.current = false;
    return () => {
      scope.current = null;
    };
  }, [owner]);
  const url = `${appConfig.frontendOrigin}/draft#token=${token}`;
  const copy = useCallback(async () => {
    if (scope.current !== owner || owner.disabled || pending.current) return;
    if (Date.parse(owner.expiresAt) <= Date.now()) {
      setResult({ owner, state: 'expired' });
      return;
    }
    pending.current = true;
    setResult({ owner, state: 'copying' });
    try {
      await navigator.clipboard.writeText(url);
      if (scope.current === owner) setResult({ owner, state: 'copied' });
    } catch {
      if (scope.current === owner) setResult({ owner, state: 'manual' });
    } finally {
      if (scope.current === owner) pending.current = false;
    }
  }, [owner, url]);
  const state = result?.owner === owner ? result.state : null;
  useEffect(() => {
    if (state !== 'manual') return;
    const timer = window.setTimeout(
      () => {
        if (scope.current === owner) setResult({ owner, state: 'expired' });
      },
      Math.max(0, Date.parse(expiresAt) - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [state, owner, expiresAt]);
  return {
    copy,
    copied: state === 'copied',
    busy: state === 'copying',
    manualUrl: state === 'manual' ? url : null,
    message:
      state === 'copied'
        ? '링크를 복사했어요.'
        : state === 'expired'
          ? '링크 사용 기한이 지났어요.'
          : '',
  };
}
