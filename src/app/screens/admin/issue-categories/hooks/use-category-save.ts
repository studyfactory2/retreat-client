import { useLayoutEffect, useRef, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import type { AdminIssueCategoryDto } from '../../../../features/admin-issue-categories/admin-issue-category.types';

type SaveState = { busy: boolean; blocked?: boolean; message?: string };
export function useCategorySave(
  token: string,
  rejectSession: (token: string) => void,
) {
  const owner = useRef<string | null>(token);
  const request = useRef<AbortController | null>(null);
  const locked = useRef(false);
  const [result, setResult] = useState<{ owner: string; state: SaveState }>();
  useLayoutEffect(() => {
    owner.current = token;
    locked.current = false;
    return () => {
      owner.current = null;
      request.current?.abort();
      request.current = null;
    };
  }, [token]);
  async function save(
    operation: (signal: AbortSignal) => Promise<AdminIssueCategoryDto>,
    onSaved: (data: AdminIssueCategoryDto) => void,
  ) {
    if (owner.current !== token || request.current || locked.current) return;
    const controller = new AbortController();
    request.current = controller;
    const current = () =>
      owner.current === token &&
      request.current === controller &&
      !controller.signal.aborted;
    setResult({ owner: token, state: { busy: true } });
    try {
      const data = await operation(controller.signal);
      if (!current()) return;
      locked.current = true;
      onSaved(data);
    } catch (error) {
      if (!current()) return;
      if (
        error instanceof ApiRequestError &&
        [401, 403].includes(error.status ?? 0)
      ) {
        locked.current = true;
        rejectSession(token);
        return;
      }
      const uncertain =
        !(error instanceof ApiRequestError) ||
        error.status === null ||
        error.status >= 500 ||
        (error.status >= 200 && error.status < 300);
      const conflict =
        error instanceof ApiRequestError &&
        (error.status === 404 ||
          (error.status === 409 &&
            ![
              'ISSUE_CATEGORY_NAME_EXISTS',
              'ISSUE_CATEGORY_FALLBACK_PROTECTED',
            ].includes(error.code)));
      locked.current = uncertain || conflict;
      setResult({
        owner: token,
        state: {
          busy: false,
          blocked: locked.current,
          message: uncertain
            ? '저장 결과를 확인하지 못했습니다. 이미 저장되었을 수 있습니다. 입력 내용을 확인한 뒤 최신 정보를 다시 불러와 주세요. 자동으로 다시 저장하지 않습니다.'
            : error instanceof ApiRequestError
              ? error.message
              : '분류를 저장하지 못했습니다.',
        },
      });
    } finally {
      if (request.current === controller) request.current = null;
    }
  }
  function clearError() {
    if (owner.current === token && !request.current && !locked.current)
      setResult(undefined);
  }
  return {
    state:
      result?.owner === token ? result.state : ({ busy: false } as SaveState),
    save,
    clearError,
  };
}
