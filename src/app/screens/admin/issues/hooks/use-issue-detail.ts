import { useEffect, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { getAdminIssue } from '../../../../features/admin-issues/admin-issues-api';
import type { AdminIssueDetailDto } from '../../../../features/admin-issues/admin-issues.types';

type Resource =
  | { status: 'loading' }
  | { status: 'ready'; data: AdminIssueDetailDto }
  | { status: 'error'; message: string };

export function useIssueDetail(
  id: string,
  token: string,
  rejectSession: (token: string) => void,
) {
  const [generation, setGeneration] = useState(0);
  const key = `${id}:${generation}`;
  const [result, setResult] = useState<{
    key: string;
    owner: string;
    resource: Resource;
  }>();
  useEffect(() => {
    const controller = new AbortController();
    void getAdminIssue(id, token, controller.signal).then(
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
            message:
              error instanceof ApiRequestError
                ? error.message
                : '이상사항을 불러오지 못했습니다. 다시 시도해 주세요.',
          },
        });
      },
    );
    return () => controller.abort();
  }, [id, key, token, rejectSession]);
  const resource: Resource =
    result?.key === key && result.owner === token
      ? result.resource
      : { status: 'loading' };
  return { resource, refresh: () => setGeneration((value) => value + 1) };
}
