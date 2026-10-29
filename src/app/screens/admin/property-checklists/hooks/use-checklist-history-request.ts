import { useEffect, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';

type Resource<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; message: string };

// Each request owns its result; changing a page or version immediately hides old data.
export function useChecklistHistoryRequest<T>(
  load: (signal: AbortSignal) => Promise<T>,
  token: string,
  rejectSession: (token: string) => void,
) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    load: typeof load;
    attempt: number;
    token: string;
    resource: Resource<T>;
  }>();
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted)
          setState({
            load,
            attempt,
            token,
            resource: { status: 'ready', data },
          });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        if (
          error instanceof ApiRequestError &&
          [401, 403].includes(error.status ?? 0)
        ) {
          rejectSession(token);
          return;
        }
        setState({
          load,
          attempt,
          token,
          resource: {
            status: 'error',
            message:
              error instanceof ApiRequestError && error.status === 404
                ? '해당 버전이 없습니다. 버전 목록에서 다시 선택해 주세요.'
                : '버전 정보를 불러오지 못했습니다. 다시 시도해 주세요.',
          },
        });
      },
    );
    return () => controller.abort();
  }, [load, attempt, token, rejectSession]);
  return {
    resource:
      state?.load === load && state.attempt === attempt && state.token === token
        ? state.resource
        : ({ status: 'loading' } as Resource<T>),
    retry: () => setAttempt((value) => value + 1),
  };
}
