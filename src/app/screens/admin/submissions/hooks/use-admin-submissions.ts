import { useEffect, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { getAdminSubmissions } from '../../../../features/admin-submissions/admin-submissions-api';
import type {
  AdminSubmissionListDto,
  AdminSubmissionListInput,
} from '../../../../features/admin-submissions/admin-submissions.types';
import { submissionListSearch } from '../model/submission-list-model';

type SubmissionListResource =
  | { status: 'loading' }
  | { status: 'ready'; data: AdminSubmissionListDto }
  | { status: 'error'; message: string };

export function useAdminSubmissions(
  input: AdminSubmissionListInput,
  token: string,
  rejectSession: (token: string) => void,
  enabled = true,
) {
  const { page, propertyId, stayId, type, status, linkStatus, from, to } = input;
  const [revision, setRevision] = useState(0);
  const key = `${submissionListSearch(input)}:${enabled}:${revision}`;
  const [result, setResult] = useState<{
    key: string;
    owner: string;
    resource: SubmissionListResource;
  }>();
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    void getAdminSubmissions(
      { page, propertyId, stayId, type, status, linkStatus, from, to },
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
                : '체크리스트 기록을 불러오지 못했습니다. 다시 시도해 주세요.',
          },
        });
      },
    );
    return () => controller.abort();
  }, [
    page,
    propertyId,
    stayId,
    type,
    status,
    linkStatus,
    from,
    to,
    key,
    enabled,
    token,
    rejectSession,
  ]);
  const resource: SubmissionListResource =
    result?.key === key && result.owner === token
      ? result.resource
      : { status: 'loading' };
  return { resource, refresh: () => setRevision((value) => value + 1) };
}
