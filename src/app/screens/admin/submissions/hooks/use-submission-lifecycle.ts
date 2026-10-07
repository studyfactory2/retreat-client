import { useEffect, useRef, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { changeAdminSubmissionLifecycle } from '../../../../features/admin-submissions/admin-submission-lifecycle.api';
import type {
  AdminSubmissionLifecycleAction,
  AdminSubmissionLifecycleInput,
  AdminSubmissionLifecycleReceipt,
} from '../../../../features/admin-submissions/admin-submission-lifecycle.types';
import type { AdminSubmissionDetail } from '../../../../features/admin-submissions/admin-submissions.types';

type LifecycleState = {
  status: 'idle' | 'saving' | 'error' | 'conflict' | 'unknown';
  busy: boolean;
  blocked: boolean;
  message?: string;
};

export function useSubmissionLifecycle(
  detail: AdminSubmissionDetail,
  action: AdminSubmissionLifecycleAction,
  token: string,
  rejectSession: (token: string) => void,
) {
  const scope = `${detail.id}:${detail.currentRevision}:${detail.status}:${action}`;
  const pending = useRef<AbortController | null>(null);
  const blocked = useRef(false);
  const [result, setResult] = useState<{
    owner: string;
    scope: string;
    state: LifecycleState;
  }>();
  useEffect(() => {
    blocked.current = false;
    return () => {
      pending.current?.abort();
      pending.current = null;
    };
  }, [scope, token]);
  async function save(
    input: AdminSubmissionLifecycleInput,
    onSaved: (receipt: AdminSubmissionLifecycleReceipt) => void,
  ) {
    if (pending.current || blocked.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setResult({
      owner: token,
      scope,
      state: { status: 'saving', busy: true, blocked: false },
    });
    try {
      const receipt = await changeAdminSubmissionLifecycle(
        detail,
        action,
        input,
        token,
        controller.signal,
      );
      if (controller.signal.aborted) return;
      // A replay receipt may describe an earlier action. Always refresh current
      // detail/history through the parent before opening another mutation flow.
      blocked.current = true;
      onSaved(receipt);
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
      const stale =
        error instanceof ApiRequestError &&
        (error.status === 404 || error.status === 409);
      const uncertain =
        !(error instanceof ApiRequestError) ||
        error.status === null ||
        error.status >= 500 ||
        (error.status >= 200 && error.status < 300);
      blocked.current = stale || uncertain;
      setResult({
        owner: token,
        scope,
        state: {
          status: stale ? 'conflict' : uncertain ? 'unknown' : 'error',
          busy: false,
          blocked: stale || uncertain,
          message: uncertain
            ? '처리 결과를 확인하지 못했습니다. 이미 저장되었을 수 있습니다. 최신 기록과 이력을 확인한 뒤 다시 진행해 주세요.'
            : stale
              ? '제출 기록이 변경되었거나 현재 상태에서 처리할 수 없습니다. 최신 기록을 확인한 뒤 다시 진행해 주세요.'
              : error instanceof ApiRequestError
                ? error.message
                : '제출 기록을 처리하지 못했습니다.',
        },
      });
    } finally {
      if (pending.current === controller) pending.current = null;
    }
  }
  return {
    save,
    state:
      result?.owner === token && result.scope === scope
        ? result.state
        : ({ status: 'idle', busy: false, blocked: false } as LifecycleState),
  };
}
