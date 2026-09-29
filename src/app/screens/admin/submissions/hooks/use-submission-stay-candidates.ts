import { useEffect, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { getSubmissionStayCandidates } from '../../../../features/admin-submissions/admin-submission-stays-api';
import type { SubmissionStayCandidatesDto } from '../../../../features/admin-submissions/admin-submission-stays.types';
import type { AdminSubmissionDetail } from '../../../../features/admin-submissions/admin-submissions.types';

type Resource =
  | { status: 'loading' }
  | { status: 'ready'; data: SubmissionStayCandidatesDto }
  | { status: 'error'; message: string; blocked: boolean };

export function useSubmissionStayCandidates(
  detail: AdminSubmissionDetail,
  enabled: boolean,
  token: string,
  rejectSession: (token: string) => void,
) {
  const [page, setPage] = useState(1);
  const [generation, setGeneration] = useState(0);
  const key = `${detail.id}:${detail.currentRevision}:${page}:${generation}`;
  const [result, setResult] = useState<{
    key: string;
    owner: string;
    resource: Resource;
  }>();
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    void getSubmissionStayCandidates(
      detail,
      page,
      token,
      controller.signal,
    ).then(
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
            blocked:
              error instanceof ApiRequestError &&
              (error.status === 409 || error.status === 404),
            message:
              error instanceof ApiRequestError
                ? error.message
                : '연결 가능한 일정을 불러오지 못했습니다.',
          },
        });
      },
    );
    return () => controller.abort();
  }, [detail, enabled, page, key, token, rejectSession]);
  const resource: Resource =
    result?.key === key && result.owner === token
      ? result.resource
      : { status: 'loading' };
  return {
    resource,
    page,
    setPage,
    refresh: () => {
      setPage(1);
      setGeneration((value) => value + 1);
    },
  };
}
