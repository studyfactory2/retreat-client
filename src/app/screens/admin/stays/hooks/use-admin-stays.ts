import { useEffect, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { getAdminStays } from '../../../../features/admin-stays/admin-stay-management-api';
import type {
  AdminStayListDto,
  GetAdminStaysInput,
} from '../../../../features/admin-stays/admin-stay-management.types';
import { stayListSearch } from '../model/stay-list-model';

type StayListResource =
  | { status: 'loading' }
  | { status: 'ready'; data: AdminStayListDto }
  | { status: 'error'; message: string };

export function useAdminStays(
  input: GetAdminStaysInput,
  token: string,
  rejectSession: (token: string) => void,
) {
  const { page, search, propertyId, status } = input;
  const [revision, setRevision] = useState(0);
  const key = `${stayListSearch(input)}:${revision}`;
  const [result, setResult] = useState<{
    key: string;
    owner: string;
    resource: StayListResource;
  }>();

  useEffect(() => {
    const controller = new AbortController();
    void getAdminStays(
      { page, search, propertyId, status },
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
                : '이용 일정 목록을 불러오지 못했습니다. 다시 시도해 주세요.',
          },
        });
      },
    );
    return () => controller.abort();
  }, [page, search, propertyId, status, key, token, rejectSession]);

  const resource: StayListResource =
    result?.key === key && result.owner === token
      ? result.resource
      : { status: 'loading' };
  return { resource, refresh: () => setRevision((value) => value + 1) };
}
