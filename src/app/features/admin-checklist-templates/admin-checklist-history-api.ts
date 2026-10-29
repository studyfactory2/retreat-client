import { apiRequest } from '../../core/api/api-client';
import { requireChecklistId } from './admin-checklist-template-validation';
import {
  CHECKLIST_HISTORY_PAGE_SIZE,
  readChecklistVersion,
  readChecklistVersionHistory,
  requireChecklistHistoryPage,
  requireChecklistHistoryVersion,
} from './admin-checklist-history-readers';
import type {
  ChecklistVersionDetail,
  ChecklistVersionHistory,
} from './admin-checklist-history.types';

export async function getChecklistVersionHistory(
  id: string,
  page: number,
  token: string,
  signal?: AbortSignal,
): Promise<ChecklistVersionHistory> {
  const templateId = requireChecklistId(id);
  const requestedPage = requireChecklistHistoryPage(page);
  const query = new URLSearchParams({
    page: String(requestedPage),
    limit: String(CHECKLIST_HISTORY_PAGE_SIZE),
  });
  return readChecklistVersionHistory(
    await apiRequest<unknown>(
      `/admin/checklist-templates/${templateId}/versions?${query}`,
      { token, signal },
    ),
    templateId,
    requestedPage,
  );
}

export async function getChecklistVersion(
  id: string,
  version: number,
  token: string,
  signal?: AbortSignal,
): Promise<ChecklistVersionDetail> {
  const templateId = requireChecklistId(id);
  const requestedVersion = requireChecklistHistoryVersion(version);
  return readChecklistVersion(
    await apiRequest<unknown>(
      `/admin/checklist-templates/${templateId}/versions/${requestedVersion}`,
      { token, signal },
    ),
    templateId,
    requestedVersion,
  );
}
