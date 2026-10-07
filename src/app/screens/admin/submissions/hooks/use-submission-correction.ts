import { useEffect, useRef, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { correctAdminSubmission } from '../../../../features/admin-submissions/admin-submission-correction.api';
import type {
  AdminSubmissionCorrectionInput,
  AdminSubmissionCorrectionReceipt,
} from '../../../../features/admin-submissions/admin-submission-correction.types';
import type { AdminSubmissionDetail } from '../../../../features/admin-submissions/admin-submissions.types';

type CorrectionState = {
  status: 'idle' | 'saving' | 'error' | 'conflict' | 'unknown';
  busy: boolean;
  blocked: boolean;
  message?: string;
};

export function useSubmissionCorrection(
  detail: AdminSubmissionDetail,
  token: string,
  rejectSession: (token: string) => void,
) {
  const scope = `${detail.id}:${detail.currentRevision}`;
  const pending = useRef<AbortController | null>(null);
  const blocked = useRef(false);
  const [result, setResult] = useState<{
    owner: string;
    scope: string;
    state: CorrectionState;
  }>();
  useEffect(() => {
    blocked.current = false;
    return () => {
      pending.current?.abort();
      pending.current = null;
    };
  }, [scope, token]);
  async function save(
    input: AdminSubmissionCorrectionInput,
    onSaved: (receipt: AdminSubmissionCorrectionReceipt) => void,
  ) {
    if (pending.current || blocked.current || detail.status !== 'SUBMITTED')
      return;
    const controller = new AbortController();
    pending.current = controller;
    setResult({
      owner: token,
      scope,
      state: { status: 'saving', busy: true, blocked: false },
    });
    try {
      const receipt = await correctAdminSubmission(
        detail,
        input,
        token,
        controller.signal,
      );
      if (controller.signal.aborted) return;
      // Keep writes locked while the parent refreshes current detail/history.
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
            ? '정정 결과를 확인하지 못했습니다. 이미 저장되었을 수 있습니다. 최신 기록과 이력을 확인한 뒤 다시 진행해 주세요.'
            : stale
              ? '제출 기록이 변경되었거나 더 이상 정정할 수 없습니다. 입력 내용을 확인한 뒤 최신 기록을 불러와 주세요.'
              : error instanceof ApiRequestError
                ? error.message
                : '정정 내용을 저장하지 못했습니다.',
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
        : ({ status: 'idle', busy: false, blocked: false } as CorrectionState),
  };
}
