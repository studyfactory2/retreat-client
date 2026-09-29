import { useEffect, useRef, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { linkSubmissionStay } from '../../../../features/admin-submissions/admin-submission-stays-api';
import type {
  LinkSubmissionStayInput,
  SubmissionStayLinkDto,
} from '../../../../features/admin-submissions/admin-submission-stays.types';

type SaveState = {
  busy: boolean;
  blocked?: 'stale' | 'uncertain';
  message?: string;
};

export function useSubmissionStaySave(
  token: string,
  rejectSession: (token: string) => void,
) {
  const pending = useRef<AbortController | null>(null);
  const blocked = useRef(false);
  const [result, setResult] = useState<{ owner: string; state: SaveState }>();
  useEffect(() => {
    blocked.current = false;
    return () => {
      pending.current?.abort();
      pending.current = null;
    };
  }, [token]);
  async function save(
    id: string,
    input: LinkSubmissionStayInput,
    onSaved: (result: SubmissionStayLinkDto) => void,
  ) {
    if (pending.current || blocked.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setResult({ owner: token, state: { busy: true } });
    try {
      const receipt = await linkSubmissionStay(
        id,
        input,
        token,
        controller.signal,
      );
      if (!controller.signal.aborted) {
        // Keep the editor locked until the parent reloads the current record.
        blocked.current = true;
        onSaved(receipt);
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
      const stale =
        error instanceof ApiRequestError &&
        (error.status === 409 || error.status === 404);
      const uncertain =
        !(error instanceof ApiRequestError) ||
        error.status === null ||
        error.status >= 500 ||
        (error.status >= 200 && error.status < 300);
      blocked.current = stale || uncertain;
      setResult({
        owner: token,
        state: {
          busy: false,
          blocked: stale ? 'stale' : uncertain ? 'uncertain' : undefined,
          message: uncertain
            ? '저장 결과를 확인하지 못했습니다. 이미 저장되었을 수 있습니다. 최신 기록과 이력을 확인한 뒤 다시 진행해 주세요.'
            : error instanceof ApiRequestError
              ? error.message
              : '연결 변경을 저장하지 못했습니다.',
        },
      });
    } finally {
      if (pending.current === controller) pending.current = null;
    }
  }
  return {
    save,
    state:
      result?.owner === token ? result.state : ({ busy: false } as SaveState),
  };
}
