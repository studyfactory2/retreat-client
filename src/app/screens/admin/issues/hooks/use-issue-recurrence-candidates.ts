import { useEffect, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { getAdminIssueRecurrenceCandidates } from '../../../../features/admin-issues/admin-issues-api';
import type {
  AdminIssueListDto,
  AdminIssueRecordDto,
} from '../../../../features/admin-issues/admin-issues.types';

type Resource =
  | { status: 'loading' }
  | { status: 'ready'; data: AdminIssueListDto }
  | { status: 'error'; message: string; changed: boolean };

export function useIssueRecurrenceCandidates(
  issue: AdminIssueRecordDto,
  page: number,
  enabled: boolean,
  token: string,
  rejectSession: (token: string) => void,
) {
  const [generation, setGeneration] = useState(0);
  const key = `${issue.id}:${issue.currentVersion}:${page}:${generation}`;
  const [result, setResult] = useState<{
    key: string;
    owner: string;
    resource: Resource;
  }>();
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    void getAdminIssueRecurrenceCandidates(
      issue,
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
            changed:
              error instanceof ApiRequestError &&
              (error.status === 404 || error.status === 409),
            message:
              error instanceof ApiRequestError
                ? error.message
                : '이전 이상사항을 불러오지 못했습니다. 다시 시도해 주세요.',
          },
        });
      },
    );
    return () => controller.abort();
  }, [issue, page, enabled, token, key, rejectSession]);
  const resource: Resource =
    enabled && result?.key === key && result.owner === token
      ? result.resource
      : { status: 'loading' };
  return { resource, refresh: () => setGeneration((value) => value + 1) };
}
