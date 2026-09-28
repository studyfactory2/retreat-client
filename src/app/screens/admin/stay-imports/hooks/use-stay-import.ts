import { useEffect, useRef, useState } from 'react';
import {
  ApiRequestError,
  type ApiFieldError,
} from '../../../../core/api/api-error';
import { getStayImport } from '../../../../features/admin-stay-imports/admin-stay-imports-api';
import type {
  GetStayImportInput,
  StayImportPreviewDto,
} from '../../../../features/admin-stay-imports/admin-stay-imports.types';
import { importFilterSearch } from '../model/import-review-model';

type Resource =
  | { status: 'loading' }
  | { status: 'ready'; data: StayImportPreviewDto }
  | { status: 'error'; message: string };
export function useStayImport(
  id: string,
  input: GetStayImportInput,
  token: string,
  rejectSession: (token: string) => void,
) {
  const [revision, setRevision] = useState(0);
  const query = importFilterSearch(input);
  const key = `${id}:${query}:${revision}`;
  const [result, setResult] = useState<{
    key: string;
    token: string;
    resource: Resource;
  }>();
  useEffect(() => {
    const controller = new AbortController();
    void getStayImport(id, input, token, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted)
          setResult({ key, token, resource: { status: 'ready', data } });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        if (
          error instanceof ApiRequestError &&
          (error.status === 401 || error.status === 403)
        ) {
          rejectSession(token);
          return;
        }
        setResult({
          key,
          token,
          resource: {
            status: 'error',
            message:
              error instanceof ApiRequestError
                ? error.message
                : '미리보기를 불러오지 못했습니다.',
          },
        });
      },
    );
    return () => controller.abort();
    // query contains every supported input field; use a stable request identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, query, key, token, rejectSession]);
  const resource: Resource =
    result?.key === key && result.token === token
      ? result.resource
      : { status: 'loading' };
  return { resource, refresh: () => setRevision((value) => value + 1) };
}

export type ImportMutationState = {
  busy: boolean;
  blocked: boolean;
  needsReview: boolean;
  message?: string;
  errors: ApiFieldError[];
};
const initial: ImportMutationState = {
  busy: false,
  blocked: false,
  needsReview: false,
  errors: [],
};
export function useImportMutation(
  token: string,
  rejectSession: (token: string) => void,
) {
  const pending = useRef<AbortController | null>(null);
  const blocked = useRef(false);
  const [result, setResult] = useState<{
    token: string;
    state: ImportMutationState;
  }>();
  useEffect(() => {
    blocked.current = false;
    return () => {
      pending.current?.abort();
      pending.current = null;
    };
  }, [token]);
  async function run<T>(
    operation: (signal: AbortSignal) => Promise<T>,
    success: (data: T) => void,
  ) {
    if (pending.current || blocked.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setResult({ token, state: { ...initial, busy: true } });
    try {
      const data = await operation(controller.signal);
      if (!controller.signal.aborted) {
        setResult({ token, state: initial });
        success(data);
      }
    } catch (error: unknown) {
      if (controller.signal.aborted) return;
      if (
        error instanceof ApiRequestError &&
        (error.status === 401 || error.status === 403)
      ) {
        blocked.current = true;
        rejectSession(token);
        return;
      }
      const needsReview =
        error instanceof ApiRequestError &&
        error.code === 'IMPORT_ROWS_NOT_READY';
      const uncertain =
        !(error instanceof ApiRequestError) ||
        error.status === null ||
        error.status >= 500 ||
        (error.status >= 200 && error.status < 300);
      const changed =
        error instanceof ApiRequestError &&
        error.status === 409 &&
        !needsReview;
      blocked.current = uncertain || changed;
      setResult({
        token,
        state: {
          busy: false,
          blocked: blocked.current,
          needsReview,
          errors: error instanceof ApiRequestError ? error.errors : [],
          message: uncertain
            ? '처리 결과를 확인하지 못했습니다. 이미 저장되었을 수 있으니 최신 미리보기를 불러와 확인해 주세요.'
            : changed
              ? '다른 변경이 먼저 저장되었거나 명단 상태가 바뀌었습니다. 최신 미리보기를 확인해 주세요.'
              : error instanceof ApiRequestError
                ? error.message
                : '요청을 처리하지 못했습니다.',
        },
      });
    } finally {
      if (pending.current === controller) pending.current = null;
    }
  }
  return {
    state: result?.token === token ? result.state : initial,
    run,
    reset: () => {
      if (pending.current) return;
      blocked.current = false;
      setResult({ token, state: initial });
    },
  };
}
