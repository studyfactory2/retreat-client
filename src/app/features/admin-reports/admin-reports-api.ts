import { apiDownload } from '../../core/api/api-client';
import { readAdminReportBlob } from './admin-reports-readers';
import type {
  AdminReportDownload,
  AdminReportQuery,
} from './admin-reports.types';
import { prepareAdminReportQuery } from './admin-reports-validation';

export async function getAdminReportExcel(
  query: AdminReportQuery,
  token: string,
  signal?: AbortSignal,
): Promise<AdminReportDownload> {
  const prepared = prepareAdminReportQuery(query);
  const search = new URLSearchParams({ from: prepared.from, to: prepared.to });
  if (prepared.propertyId !== undefined)
    search.set('propertyId', prepared.propertyId);
  const blob = await readAdminReportBlob(
    await apiDownload(`/admin/reports/excel?${search.toString()}`, {
      token,
      signal,
      timeoutMs: 60_000,
    }),
  );
  if (signal?.aborted) throw new DOMException('Request cancelled', 'AbortError');
  return {
    blob,
    // The core transport returns a Blob, so derive the same server filename
    // from the validated request snapshot without trusting header text.
    filename: `retreat-report-${prepared.from}-${prepared.to}.xlsx`,
  };
}
