import { useEffect, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { getAdminIssueHistory } from '../../../../features/admin-issues/admin-issues-api';
import type {
  AdminIssueDetailDto,
  AdminIssueHistoryDto,
} from '../../../../features/admin-issues/admin-issues.types';
import { verifyIssueHistory } from '../model/issue-presentation';

type Resource =
  | { status: 'loading' }
  | { status: 'ready'; data: AdminIssueHistoryDto }
  | { status: 'error'; message: string; changed: boolean };

export function useIssueHistory(
  detail: AdminIssueDetailDto,
  page: number,
  token: string,
  rejectSession: (token: string) => void,
) {
  const [generation, setGeneration] = useState(0);
  const key = `${detail.issue.id}:${detail.issue.currentVersion}:${page}:${generation}`;
  const [result, setResult] = useState<{
    key: string;
    owner: string;
    resource: Resource;
  }>();
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      const data = await getAdminIssueHistory(
        detail.issue.id,
        page,
        token,
        controller.signal,
      );
      verifyIssueHistory(data, detail, page);
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
              error.code === 'ISSUE_HISTORY_CHANGED',
            message:
              error instanceof ApiRequestError
                ? error.message
                : '처리 이력을 불러오지 못했습니다. 다시 시도해 주세요.',
          },
        });
      },
    );
    return () => controller.abort();
  }, [detail, page, key, token, rejectSession]);
  const resource: Resource =
    result?.key === key && result.owner === token
      ? result.resource
      : { status: 'loading' };
  return { resource, refresh: () => setGeneration((value) => value + 1) };
}
