import { useCallback, useLayoutEffect, useRef } from 'react';

export function useAccountRequest() {
  const current = useRef<AbortController | null>(null);
  useLayoutEffect(
    () => () => {
      current.current?.abort();
      current.current = null;
    },
    [],
  );
  const start = useCallback(() => {
    current.current?.abort();
    const request = new AbortController();
    current.current = request;
    return request;
  }, []);
  const isCurrent = useCallback(
    (request: AbortController) =>
      current.current === request && !request.signal.aborted,
    [],
  );
  return { start, isCurrent };
}
