import { useCallback, useEffect, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { getAdminCalendarPage } from '../../../../features/admin-calendar/admin-calendar-api';
import { getAdminMaintenance } from '../../../../features/admin-maintenance/admin-maintenance-api';
import { getAdminSubmissions } from '../../../../features/admin-submissions/admin-submissions-api';

export type DashboardActivityResource<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; message: string };

function useActivityResource<T>(
  queryKey: string,
  load: (signal: AbortSignal) => Promise<T>,
  token: string,
  rejectSession: (token: string) => void,
  fallbackMessage: string,
) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    owner: string;
    resource: DashboardActivityResource<T>;
  }>();
  const key = JSON.stringify([queryKey, revision]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal).then(
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
                : fallbackMessage,
          },
        });
      },
    );
    return () => controller.abort();
  }, [key, load, token, rejectSession, fallbackMessage]);

  // A different filter or authenticated user must never briefly see old rows
  // while the next effect is starting. Aborted requests cannot overwrite them.
  const resource: DashboardActivityResource<T> =
    result?.key === key && result.owner === token
      ? result.resource
      : { status: 'loading' };
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  return { resource, refresh };
}

export function useDashboardActivity(
  {
    date,
    today,
    propertyId,
  }: { date: string; today: string; propertyId?: string },
  token: string,
  rejectSession: (token: string) => void,
) {
  const loadStays = useCallback(
    async (signal: AbortSignal) => {
      const data = await getAdminCalendarPage(
        { page: 1, from: date, to: date, propertyId },
        token,
        signal,
      );
      if (data.today !== today)
        throw new ApiRequestError(
          '날짜가 바뀌었습니다. 상단 새로고침으로 운영 현황을 다시 확인해 주세요.',
          200,
          'DASHBOARD_DATE_CHANGED',
        );
      return data;
    },
    [date, today, propertyId, token],
  );
  const loadMaintenance = useCallback(
    (signal: AbortSignal) =>
      getAdminMaintenance(
        {
          page: 1,
          propertyId,
          dateField: 'STARTED',
          view: 'ALL',
          from: date,
          to: date,
        },
        token,
        signal,
      ),
    [date, propertyId, token],
  );
  const loadSubmissions = useCallback(
    (signal: AbortSignal) =>
      getAdminSubmissions(
        { page: 1, propertyId, status: 'SUBMITTED' },
        token,
        signal,
      ),
    [propertyId, token],
  );

  const stays = useActivityResource(
    JSON.stringify([date, today, propertyId]),
    loadStays,
    token,
    rejectSession,
    '이용 일정을 불러오지 못했습니다. 다시 시도해 주세요.',
  );
  const maintenance = useActivityResource(
    JSON.stringify([date, propertyId]),
    loadMaintenance,
    token,
    rejectSession,
    '정비 기록을 불러오지 못했습니다. 다시 시도해 주세요.',
  );
  const submissions = useActivityResource(
    JSON.stringify([propertyId]),
    loadSubmissions,
    token,
    rejectSession,
    '제출 기록을 불러오지 못했습니다. 다시 시도해 주세요.',
  );

  return { stays, maintenance, submissions };
}
