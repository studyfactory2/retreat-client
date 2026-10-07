import { useEffect, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { getAdminIssue } from '../../../../features/admin-issues/admin-issues-api';
import { invalidIssueResponse } from '../../../../features/admin-issues/admin-issues-validation';
import type { AdminIssueRecordDto } from '../../../../features/admin-issues/admin-issues.types';

type Resource =
  | { status: 'empty' }
  | { status: 'loading' }
  | { status: 'ready'; data: AdminIssueRecordDto }
  | { status: 'error'; message: string };

export function useIssueLinkedReport(
  issue: AdminIssueRecordDto,
  token: string,
  rejectSession: (token: string) => void,
) {
  const [generation, setGeneration] = useState(0);
  const id = issue.recurrenceOfIssueId;
  const key = `${issue.id}:${issue.currentVersion}:${id ?? ''}:${generation}`;
  const [result, setResult] = useState<{
    key: string;
    owner: string;
    resource: Resource;
  }>();
  useEffect(() => {
    if (id === null) return;
    const controller = new AbortController();
    async function load() {
      const detail = await getAdminIssue(id!, token, controller.signal);
      // The old target may now be cancelled or otherwise ineligible. It still
      // has readable history; do not require eligibility to show/remove a link.
      if (
        detail.issue.property.id !== issue.property.id ||
        detail.issue.id === issue.id
      )
        throw invalidIssueResponse();
      return detail.issue;
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
            message:
              error instanceof ApiRequestError
                ? error.message
                : '연결된 이전 이상사항을 불러오지 못했습니다.',
          },
        });
      },
    );
    return () => controller.abort();
  }, [id, issue.id, issue.property.id, token, key, rejectSession]);
  const resource: Resource =
    id === null
      ? { status: 'empty' }
      : result?.key === key && result.owner === token
        ? result.resource
        : { status: 'loading' };
  return { resource, refresh: () => setGeneration((value) => value + 1) };
}
