import { useEffect, useState } from 'react';
import { ApiRequestError } from '../../../core/api/api-error';
import { getAdminDashboard } from '../../../features/admin-dashboard/admin-dashboard-api';
import type {
  AdminDashboardDto,
  AdminDashboardInput,
} from '../../../features/admin-dashboard/admin-dashboard.types';
import { getAdminPropertyOptions } from '../../../features/admin-properties/admin-properties-api';
import type { AdminPropertyOption } from '../../../features/admin-properties/admin-properties.types';

type Resource<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; message: string };

function handleError(
  error: unknown,
  token: string,
  rejectSession: (token: string) => void,
): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 401 || error.status === 403) rejectSession(token);
    return error.message;
  }
  return '정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
}

export function useAdminDashboard(
  input: AdminDashboardInput,
  enabled: boolean,
  token: string,
  rejectSession: (token: string) => void,
) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    resource: Resource<AdminDashboardDto>;
  }>();
  const { date, propertyId } = input;
  const key = JSON.stringify([date, propertyId, revision, enabled]);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    void getAdminDashboard({ date, propertyId }, token, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted)
          setResult({ key, resource: { status: 'ready', data } });
      },
      (error: unknown) => {
        if (!controller.signal.aborted)
          setResult({
            key,
            resource: {
              status: 'error',
              message: handleError(error, token, rejectSession),
            },
          });
      },
    );
    return () => controller.abort();
  }, [date, propertyId, enabled, token, rejectSession, key]);

  const resource: Resource<AdminDashboardDto> =
    result?.key === key ? result.resource : { status: 'loading' };
  return { resource, refresh: () => setRevision((value) => value + 1) };
}

export function useDashboardProperties(
  token: string,
  rejectSession: (token: string) => void,
) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    revision: number;
    resource: Resource<AdminPropertyOption[]>;
  }>();

  useEffect(() => {
    const controller = new AbortController();
    void getAdminPropertyOptions(token, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted)
          setResult({ revision, resource: { status: 'ready', data } });
      },
      (error: unknown) => {
        if (!controller.signal.aborted)
          setResult({
            revision,
            resource: {
              status: 'error',
              message: handleError(error, token, rejectSession),
            },
          });
      },
    );
    return () => controller.abort();
  }, [revision, token, rejectSession]);

  const resource: Resource<AdminPropertyOption[]> =
    result?.revision === revision ? result.resource : { status: 'loading' };
  return { resource, refresh: () => setRevision((value) => value + 1) };
}
