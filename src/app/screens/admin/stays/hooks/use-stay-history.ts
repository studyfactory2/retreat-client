import { useEffect, useRef, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { getAdminStayHistory } from '../../../../features/admin-stays/admin-stay-management-api';
import {
  buildStayHistoryEntries,
  stayHistoryChangedError,
  type StayHistoryEntry,
} from '../model/stay-history-model';

type HistoryResource =
  | { status: 'loading' }
  | {
      status: 'ready';
      entries: StayHistoryEntry[];
      total: number;
      totalPages: number;
    }
  | { status: 'error'; message: string };

export function useStayHistory(
  stayId: string,
  currentRevision: number,
  token: string,
  rejectSession: (token: string) => void,
) {
  const scope = `${stayId}:${currentRevision}`;
  const [selection, setSelection] = useState({ scope, page: 1 });
  const page = selection.scope === scope ? selection.page : 1;
  const [refreshId, setRefreshId] = useState(0);
  const anchorKey = `${scope}:${refreshId}`;
  const anchor = useRef<{ key: string; owner: string; total: number } | null>(
    null,
  );
  const key = `${scope}:${page}:${refreshId}`;
  const [result, setResult] = useState<{
    key: string;
    owner: string;
    resource: HistoryResource;
  }>();

  useEffect(() => {
    const controller = new AbortController();
    async function load(): Promise<HistoryResource> {
      const data = await getAdminStayHistory(
        stayId,
        page,
        token,
        controller.signal,
      );
      if (
        anchor.current?.key === anchorKey &&
        anchor.current.owner === token &&
        anchor.current.total !== data.total
      )
        throw stayHistoryChangedError();
      const older =
        page < data.totalPages
          ? await getAdminStayHistory(
              stayId,
              page + 1,
              token,
              controller.signal,
            )
          : undefined;
      return {
        status: 'ready',
        entries: buildStayHistoryEntries(data, older),
        total: data.total,
        totalPages: data.totalPages,
      };
    }
    void load().then(
      (resource) => {
        if (!controller.signal.aborted) {
          if (resource.status === 'ready')
            anchor.current = {
              key: anchorKey,
              owner: token,
              total: resource.total,
            };
          setResult({ key, owner: token, resource });
        }
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
                : '변경 이력을 불러오지 못했습니다. 다시 시도해 주세요.',
          },
        });
      },
    );
    return () => controller.abort();
  }, [stayId, currentRevision, page, key, anchorKey, token, rejectSession]);

  const resource: HistoryResource =
    result?.key === key && result.owner === token
      ? result.resource
      : { status: 'loading' };
  return {
    resource,
    page,
    selectPage: (next: number) => setSelection({ scope, page: next }),
    refresh: () => {
      setSelection({ scope, page: 1 });
      setRefreshId((value) => value + 1);
    },
  };
}
