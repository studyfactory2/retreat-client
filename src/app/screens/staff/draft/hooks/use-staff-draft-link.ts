import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
    message: string;
    busy: boolean;
  } | null>(null);
  useLayoutEffect(() => {
    scope.current = owner;
    pending.current = false;
    return () => {
      scope.current = null;
    };
  }, [owner]);
  const copy = useCallback(async () => {
    if (
      scope.current !== owner ||
      owner.disabled ||
      pending.current ||
      Date.parse(owner.expiresAt) <= Date.now()
    )
      return;
    pending.current = true;
    setResult({ owner, message: '', busy: true });
    try {
      await navigator.clipboard.writeText(
        `${appConfig.frontendOrigin}/draft#token=${owner.token}`,
      );
      if (scope.current === owner)
        setResult({
          owner,
          busy: false,
          message: '링크를 복사했어요. 나만 볼 수 있는 곳에 보관해 주세요.',
        });
    } catch {
      if (scope.current === owner)
        setResult({
          owner,
          busy: false,
          message:
            '링크를 복사하지 못했습니다. 브라우저의 주소 전체를 직접 복사해 주세요.',
        });
    } finally {
      if (scope.current === owner) pending.current = false;
    }
  }, [owner]);
  return {
    copy,
    message: result?.owner === owner ? result.message : '',
    busy: result?.owner === owner && result.busy,
  };
}
