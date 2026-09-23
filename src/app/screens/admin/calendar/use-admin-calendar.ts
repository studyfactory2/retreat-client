import { useEffect, useState } from 'react';
import { ApiRequestError } from '../../../core/api/api-error';
import { getAdminCalendar } from '../../../features/admin-calendar/admin-calendar-api';
import type {
  AdminCalendarData,
  AdminCalendarInput,
} from '../../../features/admin-calendar/admin-calendar.types';

type CalendarResource =
  | { status: 'loading' }
  | { status: 'ready'; data: AdminCalendarData }
  | { status: 'error'; message: string };

export function useAdminCalendar(
  input: AdminCalendarInput,
  enabled: boolean,
  token: string,
  rejectSession: (token: string) => void,
) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    owner: string;
    resource: CalendarResource;
  }>();
  const { from, to, propertyId } = input;
  const key = JSON.stringify([from, to, propertyId, revision, enabled]);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    void getAdminCalendar(
      { from, to, propertyId },
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
        )
          rejectSession(token);
        setResult({
          key,
          owner: token,
          resource: {
            status: 'error',
            message:
              error instanceof ApiRequestError
                ? error.message
                : '이용 일정을 불러오지 못했습니다. 다시 시도해 주세요.',
          },
        });
      },
    );
    return () => controller.abort();
  }, [from, to, propertyId, enabled, token, rejectSession, key]);

  const resource: CalendarResource =
    result?.key === key && result.owner === token
      ? result.resource
      : { status: 'loading' };
  return { resource, refresh: () => setRevision((value) => value + 1) };
}
