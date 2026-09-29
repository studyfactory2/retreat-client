import { useEffect, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { getAdminIssues } from '../../../../features/admin-issues/admin-issues-api';
import type {
  AdminIssueFilters,
  AdminIssueListDto,
} from '../../../../features/admin-issues/admin-issues.types';
import { issueSearch } from '../model/issue-filters';

type IssueListResource =
  | { status: 'loading' }
  | { status: 'ready'; data: AdminIssueListDto }
  | { status: 'error'; message: string };

export function useAdminIssues(
  filters: AdminIssueFilters,
  token: string,
  rejectSession: (token: string) => void,
  enabled = true,
) {
  const { page, propertyId, status, isUrgent, from, to } = filters;
  const [revision, setRevision] = useState(0);
  const key = `${issueSearch(filters)}:${enabled}:${revision}`;
  const [result, setResult] = useState<{
    key: string;
    owner: string;
    resource: IssueListResource;
  }>();
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    void getAdminIssues(
      { page, propertyId, status, isUrgent, from, to },
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
            message:
              error instanceof ApiRequestError
                ? error.message
                : '이상사항을 불러오지 못했습니다. 다시 시도해 주세요.',
          },
        });
      },
    );
    return () => controller.abort();
  }, [
    page,
    propertyId,
    status,
    isUrgent,
    from,
    to,
    key,
    enabled,
    token,
    rejectSession,
  ]);
  const resource: IssueListResource =
    result?.key === key && result.owner === token
      ? result.resource
      : { status: 'loading' };
  return { resource, refresh: () => setRevision((value) => value + 1) };
}
