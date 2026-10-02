import { apiRequest } from '../../core/api/api-client';
import type { GuestEntryContext } from '../guest-entry/guest-entry.types';
import { requireGuestAccessInput } from '../guest-entry/guest-entry-validation';
import { prepareGuestDraftAnswers } from './guest-draft-answers';
import {
  readGuestDraft,
  readStartedGuestDraft,
  verifySavedGuestDraft,
} from './guest-drafts-readers';
import type {
  GuestDraftAnswers,
  GuestDraftDto,
  StartGuestDraftDto,
  StartGuestDraftInput,
} from './guest-drafts.types';
import { prepareGuestDraftStart, requireDraftToken } from './guest-drafts-validation';

export async function startGuestDraft(
  entry: GuestEntryContext,
  input: StartGuestDraftInput,
  token: string,
  signal?: AbortSignal,
): Promise<StartGuestDraftDto> {
  requireGuestAccessInput(entry?.kind, token);
  const body = prepareGuestDraftStart(entry, input);
  const path = entry.kind === 'qr'
    ? '/submission-drafts/guest/start'
    : '/guest/stays/drafts/start';
  return readStartedGuestDraft(
    await apiRequest<unknown>(path, { method: 'POST', token, signal, body: { ...body } }),
    entry,
    body,
  );
}

export async function getGuestDraft(
  token: string,
  signal?: AbortSignal,
): Promise<GuestDraftDto> {
  requireDraftToken(token);
  return readGuestDraft(
    await apiRequest<unknown>('/submission-drafts/current', { token, signal }),
  );
}

export async function saveGuestDraft(
  previous: GuestDraftDto,
  answers: GuestDraftAnswers,
  token: string,
  signal?: AbortSignal,
): Promise<GuestDraftDto> {
  requireDraftToken(token);
  const base = readGuestDraft(previous);
  const normalized = prepareGuestDraftAnswers(base, answers);
  const saved = readGuestDraft(
    await apiRequest<unknown>('/submission-drafts/save', {
      method: 'POST', token, signal,
      body: {
        expectedUpdatedAt: base.updatedAt,
        // Guest writes must not contain repairReported/repairNote, even their
        // false/null response defaults: those fields are staff-only inputs.
        items: normalized.items.map(({ itemId, value, description, isUrgent }) => ({
          itemId, value, description, isUrgent,
        })),
        generalNote: normalized.generalNote,
      },
    }),
  );
  verifySavedGuestDraft(saved, base, normalized);
  return saved;
}
