import { useEffect, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { getAdminMaintenance } from '../../../../features/admin-maintenance/admin-maintenance-api';
import type {
  AdminMaintenanceDto,
  AdminMaintenanceInput,
} from '../../../../features/admin-maintenance/admin-maintenance.types';
import { maintenanceSearch } from '../model/maintenance-filters';

type MaintenanceResource =
  | { status: 'loading' }
  | { status: 'ready'; data: AdminMaintenanceDto }
  | { status: 'error'; message: string };

export function useAdminMaintenance(
  input: AdminMaintenanceInput,
  token: string,
  rejectSession: (token: string) => void,
  enabled = true,
) {
  const { page, propertyId, from, to, dateField, view } = input;
  const [revision, setRevision] = useState(0);
  const key = `${maintenanceSearch(input)}:${enabled}:${revision}`;
  const [result, setResult] = useState<{
    key: string;
    owner: string;
    resource: MaintenanceResource;
  }>();
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    void getAdminMaintenance(
      { page, propertyId, from, to, dateField, view },
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
                : '청소·정비 기록을 불러오지 못했습니다. 다시 시도해 주세요.',
          },
        });
      },
    );
    return () => controller.abort();
  }, [
    page,
    propertyId,
    from,
    to,
    dateField,
    view,
    key,
    enabled,
    token,
    rejectSession,
  ]);
  const resource: MaintenanceResource =
    result?.key === key && result.owner === token
      ? result.resource
      : { status: 'loading' };
  return { resource, refresh: () => setRevision((value) => value + 1) };
}
