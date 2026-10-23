import { useEffect, useRef, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import {
  changePropertyOperation,
  getPropertyOperation,
} from '../../../../features/admin-properties/admin-property-operation-api';
import type { PropertyOperationPreview } from '../../../../features/admin-properties/admin-property-operation.types';
import type { AdminPropertyDto } from '../../../../features/admin-properties/admin-property-management.types';

type OperationState = {
  loading: boolean;
  busy: boolean;
  preview?: PropertyOperationPreview;
  message?: string;
  needsRefresh?: boolean;
};

export function usePropertyOperation(
  id: string,
  token: string,
  rejectSession: (token: string) => void,
) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    owner: string;
    revision: number;
    state: OperationState;
  }>();
  const pending = useRef<AbortController | null>(null);
  const owner = `${id}:${token}`;
  const state =
    result?.owner === owner && result.revision === revision
      ? result.state
      : { loading: true, busy: false };

  useEffect(() => {
    const controller = new AbortController();
    pending.current = controller;
    void getPropertyOperation(id, token, controller.signal)
      .then(
        (preview) => {
          if (!controller.signal.aborted)
            setResult({
              owner,
              revision,
              state: { loading: false, busy: false, preview },
            });
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
            owner,
            revision,
            state: {
              loading: false,
              busy: false,
              message:
                error instanceof ApiRequestError
                  ? error.message
                  : '운영 상태를 불러오지 못했습니다.',
              needsRefresh: true,
            },
          });
        },
      )
      .finally(() => {
        if (pending.current === controller) pending.current = null;
      });
    return () => {
      controller.abort();
      pending.current?.abort();
      pending.current = null;
    };
  }, [id, token, owner, revision, rejectSession]);

  async function save(
    isActive: boolean,
    onSaved: (property: AdminPropertyDto) => void,
  ) {
    if (
      pending.current ||
      state.loading ||
      state.busy ||
      state.needsRefresh ||
      !state.preview
    )
      return;
    if (!isActive && state.preview.blockingStayCount > 0) return;
    const controller = new AbortController();
    pending.current = controller;
    setResult({
      owner,
      revision,
      state: { ...state, busy: true, message: undefined },
    });
    try {
      const saved = await changePropertyOperation(
        id,
        isActive,
        state.preview.property.updatedAt,
        token,
        controller.signal,
      );
      if (!controller.signal.aborted) onSaved(saved);
    } catch (error: unknown) {
      if (controller.signal.aborted) return;
      if (
        error instanceof ApiRequestError &&
        (error.status === 401 || error.status === 403)
      ) {
        rejectSession(token);
        return;
      }
      const uncertain =
        !(error instanceof ApiRequestError) ||
        error.status === null ||
        error.status >= 500 ||
        (error.status >= 200 && error.status < 300);
      setResult({
        owner,
        revision,
        state: {
          ...state,
          busy: false,
          needsRefresh: true,
          message: uncertain
            ? '저장 결과를 확인하지 못했습니다. 운영 상태를 다시 확인해 주세요.'
            : error.message,
        },
      });
    } finally {
      if (pending.current === controller) pending.current = null;
    }
  }
  return {
    state,
    save,
    reload: () => {
      if (!state.busy) setRevision((value) => value + 1);
    },
  };
}
