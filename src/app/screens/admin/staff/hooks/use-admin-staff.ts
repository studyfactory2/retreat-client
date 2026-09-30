import { useCallback, useEffect, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import {
  getAdminStaff,
  getAdminStaffList,
} from '../../../../features/admin-staff/admin-staff-api';
import type { GetAdminStaffInput } from '../../../../features/admin-staff/admin-staff.types';
import { staffListSearch } from '../model/staff-list-model';

type Resource<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; message: string };
function useStaffResource<T>(
  key: string,
  token: string,
  rejectSession: (token: string) => void,
  load: (signal: AbortSignal) => Promise<T>,
) {
  const [revision, setRevision] = useState(0);
  const requestKey = `${key}:${revision}`;
  const [result, setResult] = useState<{
    key: string;
    owner: string;
    resource: Resource<T>;
  }>();
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted)
          setResult({
            key: requestKey,
            owner: token,
            resource: { status: 'ready', data },
          });
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
          key: requestKey,
          owner: token,
          resource: {
            status: 'error',
            message:
              error instanceof ApiRequestError
                ? error.message
                : '직원 정보를 불러오지 못했습니다. 다시 시도해 주세요.',
          },
        });
      },
    );
    return () => controller.abort();
  }, [load, requestKey, token, rejectSession]);
  const resource: Resource<T> =
    result?.key === requestKey && result.owner === token
      ? result.resource
      : { status: 'loading' };
  return { resource, refresh: () => setRevision((value) => value + 1) };
}

export function useAdminStaffList(
  input: GetAdminStaffInput,
  token: string,
  rejectSession: (token: string) => void,
) {
  const { page, search, isActive } = input;
  const load = useCallback(
    (signal: AbortSignal) =>
      getAdminStaffList({ page, search, isActive }, token, signal),
    [page, search, isActive, token],
  );
  return useStaffResource(staffListSearch(input), token, rejectSession, load);
}

export function useAdminStaffDetail(
  id: string,
  token: string,
  rejectSession: (token: string) => void,
) {
  const load = useCallback(
    (signal: AbortSignal) => getAdminStaff(id, token, signal),
    [id, token],
  );
  return useStaffResource(id, token, rejectSession, load);
}
