import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { getAdminReportExcel } from '../../../../features/admin-reports/admin-reports-api';
import type {
  AdminReportQuery,
  ArchivePhotoCounts,
} from '../../../../features/admin-reports/admin-reports.types';
import { requestReportFileDownload } from '../model/report-file-download';

export type ReportDownloadState =
  | { status: 'idle' }
  | { status: 'busy' }
  | { status: 'requested'; filename: string; photos?: ArchivePhotoCounts }
  | { status: 'cancelled' }
  | { status: 'error'; message: string; code?: string };
type ReportScope = { key: string; token: string };
const archiveFailureMessages: Readonly<Record<string, string>> = {
  ARCHIVE_TIMEOUT:
    '파일 준비 시간이 초과되었습니다. 기간이나 휴양소 범위를 줄여 다시 시도해 주세요.',
  ARCHIVE_PHOTO_UNAVAILABLE:
    '사진 파일을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.',
  PHOTO_STORAGE_UNAVAILABLE:
    '사진 저장소에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.',
};

export function useReportDownload(
  token: string,
  rejectSession: (token: string) => void,
  scopeKey: string,
) {
  const context = useMemo(() => ({ key: scopeKey, token }), [scopeKey, token]);
  const scope = useRef<ReportScope | null>(context);
  const request = useRef<AbortController | null>(null);
  const [result, setResult] = useState<{
    scope: ReportScope;
    state: ReportDownloadState;
  }>();

  useLayoutEffect(() => {
    scope.current = context;
    return () => {
      scope.current = null;
      request.current?.abort();
      request.current = null;
    };
  }, [context]);

  const reset = useCallback(() => {
    const owner = scope.current;
    if (owner?.key !== scopeKey || owner.token !== token) return;
    request.current?.abort();
    request.current = null;
    setResult({ scope: owner, state: { status: 'idle' } });
  }, [scopeKey, token]);

  const cancel = useCallback(() => {
    const owner = scope.current;
    if (owner?.key !== scopeKey || owner.token !== token || !request.current)
      return;
    request.current.abort();
    request.current = null;
    setResult({ scope: owner, state: { status: 'cancelled' } });
  }, [scopeKey, token]);

  const download = useCallback(
    async (query: AdminReportQuery) => {
      const owner = scope.current;
      if (owner?.key !== scopeKey || owner.token !== token || request.current)
        return;
      const controller = new AbortController();
      request.current = controller;
      setResult({ scope: owner, state: { status: 'busy' } });
      const isCurrent = () =>
        !controller.signal.aborted &&
        request.current === controller &&
        scope.current === owner;

      try {
        const file = await getAdminReportExcel(query, token, controller.signal);
        if (!isCurrent()) return;
        requestReportFileDownload(file.blob, file.filename);
        setResult({
          scope: owner,
          state: {
            status: 'requested',
            filename: file.filename,
            photos: file.photos,
          },
        });
      } catch (error: unknown) {
        if (!isCurrent()) return;
        setResult({
          scope: owner,
          state: {
            status: 'error',
            ...(error instanceof ApiRequestError ? { code: error.code } : {}),
            message:
              error instanceof ApiRequestError
                ? (archiveFailureMessages[error.code] ?? error.message)
                : '보고서 다운로드를 시작하지 못했습니다. 다시 시도해 주세요.',
          },
        });
        if (
          error instanceof ApiRequestError &&
          (error.status === 401 || error.status === 403)
        )
          rejectSession(token);
      } finally {
        if (request.current === controller) request.current = null;
      }
    },
    [scopeKey, token, rejectSession],
  );

  const state: ReportDownloadState =
    result?.scope === context ? result.state : { status: 'idle' };
  return { state, download, reset, cancel };
}
