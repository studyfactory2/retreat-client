import { useEffect, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { getAdminSubmissionHistory } from '../../../../features/admin-submissions/admin-submissions-api';
import type { AdminSubmissionHistoryDto } from '../../../../features/admin-submissions/admin-submissions.types';
import { verifySubmissionHistory } from '../model/submission-detail-model';

type Resource =
  | { status: 'loading' }
  | { status: 'ready'; data: AdminSubmissionHistoryDto }
  | { status: 'error'; message: string; changed: boolean };

export function useSubmissionHistory(
  id: string,
  currentRevision: number,
  page: number,
  token: string,
  rejectSession: (token: string) => void,
) {
  const [generation, setGeneration] = useState(0);
  const key = `${id}:${currentRevision}:${page}:${generation}`;
  const [result, setResult] = useState<{
    key: string;
    owner: string;
    resource: Resource;
  }>();
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      const data = await getAdminSubmissionHistory(
        id,
        page,
        token,
        controller.signal,
      );
      verifySubmissionHistory(data, id, currentRevision, page);
      return data;
    }
    void load().then(
      (data) => {
        if (!controller.signal.aborted)
          setResult({ key, owner: token, resource: { status: 'ready', data } });
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
          owner: token,
          resource: {
            status: 'error',
            changed:
              error instanceof ApiRequestError &&
              error.code === 'SUBMISSION_HISTORY_CHANGED',
            message:
              error instanceof ApiRequestError
                ? error.message
                : '제출 이력을 불러오지 못했습니다. 다시 시도해 주세요.',
          },
        });
      },
    );
    return () => controller.abort();
  }, [id, currentRevision, page, key, token, rejectSession]);
  const resource: Resource =
    result?.key === key && result.owner === token
      ? result.resource
      : { status: 'loading' };
  return { resource, refresh: () => setGeneration((value) => value + 1) };
}
