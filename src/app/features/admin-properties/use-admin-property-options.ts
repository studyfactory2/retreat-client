import { useEffect, useState } from 'react';
import { ApiRequestError } from '../../core/api/api-error';
import { getAdminPropertyOptions } from './admin-properties-api';
import type { AdminPropertyOption } from './admin-properties.types';

type PropertyOptionsResource =
  | { status: 'loading' }
  | { status: 'ready'; data: AdminPropertyOption[] }
  | { status: 'error'; message: string };

export function useAdminPropertyOptions(
  token: string,
  rejectSession: (token: string) => void,
) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    revision: number;
    owner: string;
    resource: PropertyOptionsResource;
  }>();

  useEffect(() => {
    const controller = new AbortController();
    void getAdminPropertyOptions(token, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted)
          setResult({
            revision,
            owner: token,
            resource: { status: 'ready', data },
          });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        if (
          error instanceof ApiRequestError &&
          (error.status === 401 || error.status === 403)
        )
          rejectSession(token);
        setResult({
          revision,
          owner: token,
          resource: {
            status: 'error',
            message:
              error instanceof ApiRequestError
                ? error.message
                : '휴양소 목록을 불러오지 못했습니다. 다시 시도해 주세요.',
          },
        });
      },
    );
    return () => controller.abort();
  }, [revision, token, rejectSession]);

  const resource: PropertyOptionsResource =
    result?.revision === revision && result.owner === token
      ? result.resource
      : { status: 'loading' };
  return { resource, refresh: () => setRevision((value) => value + 1) };
}
