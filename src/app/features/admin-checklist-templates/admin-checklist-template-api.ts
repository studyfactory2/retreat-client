import { apiRequest } from '../../core/api/api-client';
import type {
  ChecklistTemplateDto,
  CreateChecklistTemplateInput,
  UpdateChecklistTemplateInput,
} from './admin-checklist-template.types';
import {
  readChecklistTemplate,
  readPropertyChecklistTemplates,
  verifyCreatedChecklist,
  verifyUpdatedChecklist,
} from './admin-checklist-template-readers';
import {
  prepareCreateChecklistTemplate,
  prepareUpdateChecklistTemplate,
  requireChecklistId,
} from './admin-checklist-template-validation';

export async function getPropertyChecklistTemplates(
  propertyId: string,
  token: string,
  signal?: AbortSignal,
): Promise<ChecklistTemplateDto[]> {
  const id = requireChecklistId(propertyId);
  const query = new URLSearchParams({ page: '1', limit: '3', propertyId: id });
  return readPropertyChecklistTemplates(
    await apiRequest<unknown>(`/admin/checklist-templates?${query}`, {
      token,
      signal,
    }),
    id,
  );
}

export async function getAdminChecklistTemplate(
  id: string,
  token: string,
  signal?: AbortSignal,
): Promise<ChecklistTemplateDto> {
  const templateId = requireChecklistId(id);
  return readChecklistTemplate(
    await apiRequest<unknown>(`/admin/checklist-templates/${templateId}`, {
      token,
      signal,
    }),
    templateId,
  );
}

export async function createAdminChecklistTemplate(
  input: CreateChecklistTemplateInput,
  token: string,
  signal?: AbortSignal,
): Promise<ChecklistTemplateDto> {
  const body = prepareCreateChecklistTemplate(input);
  const template = readChecklistTemplate(
    await apiRequest<unknown>('/admin/checklist-templates', {
      method: 'POST',
      token,
      signal,
      body: { ...body },
    }),
    undefined,
    body.propertyId,
  );
  verifyCreatedChecklist(template, body);
  return template;
}

export async function updateAdminChecklistTemplate(
  id: string,
  input: UpdateChecklistTemplateInput,
  token: string,
  signal?: AbortSignal,
): Promise<ChecklistTemplateDto> {
  const templateId = requireChecklistId(id);
  const body = prepareUpdateChecklistTemplate(input);
  const template = readChecklistTemplate(
    await apiRequest<unknown>(
      `/admin/checklist-templates/${templateId}/update`,
      { method: 'POST', token, signal, body: { ...body } },
    ),
    templateId,
  );
  verifyUpdatedChecklist(template, body);
  return template;
}
