import { apiDownload, apiDownloadWithHeaders } from '../../core/api/api-client';
import { readAdminArchive, readAdminReportBlob } from './admin-reports-readers';
import type {
  AdminReportDownload,
  AdminReportQuery,
} from './admin-reports.types';
import {
  ARCHIVE_MAX_BYTES,
  prepareAdminReportQuery,
} from './admin-reports-validation';

export async function getAdminReportExcel(
  query: AdminReportQuery,
  token: string,
  signal?: AbortSignal,
): Promise<AdminReportDownload> {
  const prepared = prepareAdminReportQuery(query);
  const search = new URLSearchParams({ from: prepared.from, to: prepared.to });
  if (prepared.propertyId !== undefined)
    search.set('propertyId', prepared.propertyId);
  if (prepared.mode === 'archive') {
    const archive = await readAdminArchive(
      await apiDownloadWithHeaders(
        `/admin/reports/preservation-zip?${search.toString()}`,
        { token, signal, timeoutMs: 180_000 },
        ARCHIVE_MAX_BYTES,
      ),
    );
    if (signal?.aborted)
      throw new DOMException('Request cancelled', 'AbortError');
    return {
      ...archive,
      filename: `retreat-archive-${prepared.from}-${prepared.to}.zip`,
    };
  }
  const preservation = prepared.mode === 'preservation';
  const blob = await readAdminReportBlob(
    await apiDownload(
      `/admin/reports/${preservation ? 'preservation-excel' : 'excel'}?${search.toString()}`,
      {
        token,
        signal,
        timeoutMs: 60_000,
      },
    ),
  );
  if (signal?.aborted)
    throw new DOMException('Request cancelled', 'AbortError');
  return {
    blob,
    // The core transport returns a Blob, so derive the same server filename
    // from the validated request snapshot without trusting header text.
    filename: `retreat-${preservation ? 'archive' : 'report'}-${prepared.from}-${prepared.to}.xlsx`,
  };
}
