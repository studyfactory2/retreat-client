import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { getAdminStayVehicle } from '../../../../features/admin-stay-vehicles/admin-stay-vehicle-api';
import type { AdminStayVehicleDto } from '../../../../features/admin-stay-vehicles/admin-stay-vehicle.types';
import type { AdminStayDto } from '../../../../features/admin-stays/admin-stays.types';
import {
  getStayVehicleScope,
  matchesStayVehicleContext,
} from '../model/stay-vehicle-model';

type StayVehicleResource =
  | { status: 'loading' }
  | { status: 'ready'; data: AdminStayVehicleDto }
  | { status: 'error'; message: string; needsStayRefresh?: boolean };

export function useStayVehicle(
  stay: AdminStayDto,
  token: string,
  rejectSession: (token: string) => void,
) {
  const key = getStayVehicleScope(stay);
  const [revision, setRevision] = useState(0);
  const generation = useRef(0);
  const [result, setResult] = useState<{
    key: string;
    owner: string;
    revision: number;
    resource: StayVehicleResource;
  }>();
  const scope = useRef<{ key: string; token: string } | null>({ key, token });
  const request = useRef<AbortController | null>(null);

  useLayoutEffect(() => {
    scope.current = { key, token };
    return () => {
      scope.current = null;
      request.current?.abort();
    };
  }, [key, token]);

  const refresh = useCallback(() => {
    if (scope.current?.key !== key || scope.current.token !== token) return;
    request.current?.abort();
    generation.current += 1;
    setRevision(generation.current);
  }, [key, token]);

  useEffect(() => {
    const controller = new AbortController();
    request.current = controller;
    const isCurrent = () =>
      !controller.signal.aborted &&
      request.current === controller &&
      generation.current === revision &&
      scope.current?.key === key &&
      scope.current.token === token;

    async function load() {
      try {
        const data = await getAdminStayVehicle(stay.id, token, controller.signal);
        if (!isCurrent()) return;
        setResult({
          key,
          owner: token,
          revision,
          resource: matchesStayVehicleContext(stay, data)
            ? { status: 'ready', data }
            : {
                status: 'error',
                message:
                  '이용 일정 정보가 변경되었습니다. 일정 전체를 다시 불러온 뒤 차량 정보를 확인해 주세요.',
                needsStayRefresh: true,
              },
        });
      } catch (error: unknown) {
        if (!isCurrent()) return;
        const status = error instanceof ApiRequestError ? error.status : null;
        setResult({
          key,
          owner: token,
          revision,
          resource: {
            status: 'error',
            message:
              status === 404
                ? '이용 일정을 찾을 수 없습니다. 일정 전체를 다시 불러와 주세요.'
                : error instanceof ApiRequestError
                  ? error.message
                  : '차량 정보를 불러오지 못했습니다. 다시 시도해 주세요.',
            ...(status === 404 ? { needsStayRefresh: true } : {}),
          },
        });
        if (status === 401 || status === 403) rejectSession(token);
      } finally {
        if (request.current === controller) request.current = null;
      }
    }
    void load();
    return () => {
      controller.abort();
      if (request.current === controller) request.current = null;
    };
  }, [key, stay, revision, token, rejectSession]);

  const resource: StayVehicleResource =
    result?.key === key && result.owner === token && result.revision === revision
      ? result.resource
      : { status: 'loading' };
  return { resource, refresh };
}
