import { useEffect, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { getAdminStaffList } from '../../../../features/admin-staff/admin-staff-api';
import type { AdminStaffListDto } from '../../../../features/admin-staff/admin-staff.types';

type Resource =
  | { status: 'loading' }
  | { status: 'ready'; data: AdminStaffListDto }
  | { status: 'error'; message: string };

export function usePropertyStaffCandidates(
  search: string,
  page: number,
  revision: number,
  token: string,
  rejectSession: (token: string) => void,
  onClamp: (page: number) => void,
) {
  const [result, setResult] = useState<{
    key: string;
    owner: string;
    resource: Resource;
  }>();
  const key = JSON.stringify([search, page, revision]);
  useEffect(() => {
    const controller = new AbortController();
    void getAdminStaffList(
      { page, search: search || undefined, isActive: true },
      token,
      controller.signal,
    ).then(
      (data) => {
        if (controller.signal.aborted) return;
        if (page > Math.max(1, data.totalPages)) {
          onClamp(Math.max(1, data.totalPages));
          return;
        }
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
                : '직원 목록을 불러오지 못했습니다.',
          },
        });
      },
    );
    return () => controller.abort();
  }, [search, page, revision, key, token, rejectSession, onClamp]);
  const resource: Resource =
    result?.key === key && result.owner === token
      ? result.resource
      : { status: 'loading' };
  return resource;
}
