import { apiRequest } from '../../core/api/api-client';
import type { StaffQrContextDto } from '../staff-entry/staff-entry.types';
import { requireStaffQrToken } from '../staff-entry/staff-entry-validation';
import { prepareStaffDraftAnswers } from './staff-draft-answers';
import {
  readStaffDraft,
  readStartedStaffDraft,
  verifySavedStaffDraft,
} from './staff-drafts-readers';
import type {
  StaffDraftAnswers,
  StaffDraftDto,
  StartStaffDraftDto,
  StartStaffDraftInput,
} from './staff-drafts.types';
import {
  prepareStaffDraftStart,
  requireStaffDraftToken,
} from './staff-drafts-validation';

export async function startStaffDraft(
  entry: StaffQrContextDto,
  input: StartStaffDraftInput,
  token: string,
  signal?: AbortSignal,
): Promise<StartStaffDraftDto> {
  requireStaffQrToken(token);
  const body = prepareStaffDraftStart(entry, input);
  return readStartedStaffDraft(
    await apiRequest<unknown>('/submission-drafts/staff/start', {
      method: 'POST',
      token,
      signal,
      body: { ...body },
    }),
    entry,
  );
}

export async function getStaffDraft(
  token: string,
  signal?: AbortSignal,
): Promise<StaffDraftDto> {
  requireStaffDraftToken(token);
  return readStaffDraft(
    await apiRequest<unknown>('/submission-drafts/current', { token, signal }),
  );
}

export async function saveStaffDraft(
  previous: StaffDraftDto,
  answers: StaffDraftAnswers,
  token: string,
  signal?: AbortSignal,
): Promise<StaffDraftDto> {
  requireStaffDraftToken(token);
  const base = readStaffDraft(previous);
  const normalized = prepareStaffDraftAnswers(base, answers);
  const saved = readStaffDraft(
    await apiRequest<unknown>('/submission-drafts/save', {
      method: 'POST',
      token,
      signal,
      body: {
        expectedUpdatedAt: base.updatedAt,
        // This is the complete replacement, including untouched staff repair data.
        items: normalized.items.map((answer) => ({ ...answer })),
        generalNote: normalized.generalNote,
      },
    }),
  );
  verifySavedStaffDraft(saved, base, normalized);
  return saved;
}
