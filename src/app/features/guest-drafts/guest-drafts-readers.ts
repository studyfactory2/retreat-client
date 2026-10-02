import { ApiRequestError } from '../../core/api/api-error';
import { appConfig } from '../../core/config/environment';
import { readGuestChecklistDefinition } from '../guest-entry/guest-checklist-readers';
import type { GuestEntryContext } from '../guest-entry/guest-entry.types';
import {
  isGuestAccessToken,
  isGuestId,
  isGuestText,
  isGuestTimestamp,
  isGuestVersion,
} from '../guest-entry/guest-entry-validation';
import { draftObject, readGuestDraftAnswers, sameGuestDraftAnswers } from './guest-draft-answers';
import type { GuestDraftAnswers, GuestDraftDto, StartGuestDraftDto } from './guest-drafts.types';
import {
  guestStartVisitDate,
  invalidGuestDraftResponse,
  isGuestDraftDate,
  isGuestDraftType,
  type PreparedGuestStart,
} from './guest-drafts-validation';

function nullableAuthorText(value: unknown, maximum: number): string | null {
  if (value === null) return null;
  if (typeof value !== 'string' || [...value].length > maximum)
    throw invalidGuestDraftResponse();
  return value;
}

export function readGuestDraft(value: unknown): GuestDraftDto {
  const draft = draftObject(value);
  if (draft.type === 'MAINTENANCE')
    throw new ApiRequestError(
      '이 작성 링크는 직원 정비 체크리스트용입니다. 이용객 화면에서 작성할 수 없습니다.',
      200,
      'UNSUPPORTED_GUEST_DRAFT',
    );
  const property = draftObject(draft.property);
  const author = draftObject(draft.author);
  const template = draftObject(draft.template);
  if (
    !isGuestId(draft.id) || !isGuestId(property.id) ||
    !isGuestText(property.name, 100) ||
    (property.region !== null && !isGuestText(property.region, 100)) ||
    !isGuestDraftType(draft.type) || draft.status !== 'DRAFT' ||
    !isGuestDraftDate(draft.visitDate) || draft.startedAt !== null ||
    !isGuestTimestamp(draft.createdAt) || !isGuestTimestamp(draft.updatedAt) ||
    !isGuestTimestamp(draft.expiresAt) ||
    draft.updatedAt < draft.createdAt || draft.expiresAt <= draft.createdAt ||
    author.schemaVersion !== 1 || author.role !== 'GUEST' ||
    !isGuestText(author.name, 100) ||
    Object.keys(author).some((key) => !['schemaVersion', 'role', 'name', 'company', 'department', 'phone'].includes(key)) ||
    template.schemaVersion !== 1 || !isGuestId(template.id) ||
    template.type !== draft.type || !isGuestText(template.title, 150) ||
    !isGuestVersion(template.version) ||
    Object.keys(template).some((key) => !['schemaVersion', 'id', 'type', 'title', 'version', 'definition'].includes(key))
  )
    throw invalidGuestDraftResponse();
  let definition;
  try {
    definition = readGuestChecklistDefinition(template.definition);
  } catch {
    throw invalidGuestDraftResponse();
  }
  return {
    id: draft.id.toLowerCase(),
    property: { id: property.id.toLowerCase(), name: property.name, region: property.region },
    type: draft.type,
    status: 'DRAFT',
    visitDate: draft.visitDate,
    author: {
      schemaVersion: 1, role: 'GUEST', name: author.name,
      company: nullableAuthorText(author.company, 150),
      department: nullableAuthorText(author.department, 150),
      phone: nullableAuthorText(author.phone, 50),
    },
    template: {
      schemaVersion: 1, id: template.id.toLowerCase(), type: draft.type,
      title: template.title, version: template.version, definition,
    },
    answers: readGuestDraftAnswers(draft.answers, definition),
    startedAt: null,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
    expiresAt: draft.expiresAt,
  };
}

export function readStartedGuestDraft(
  value: unknown,
  entry: GuestEntryContext,
  input: PreparedGuestStart,
): StartGuestDraftDto {
  const response = draftObject(value);
  const draft = readGuestDraft(response.draft);
  const expectedName = entry.kind === 'stay' ? entry.context.guestName : input.guestName;
  if (
    !isGuestAccessToken(response.accessToken) ||
    !isGuestTimestamp(response.expiresAt) || response.expiresAt !== draft.expiresAt ||
    response.url !== `${appConfig.frontendOrigin}/draft#token=${response.accessToken}` ||
    draft.property.id !== entry.context.property.id.toLowerCase() ||
    draft.type !== input.type || draft.author.name !== expectedName ||
    draft.visitDate !== guestStartVisitDate(entry, input) ||
    draft.answers.items.length !== 0 || draft.answers.generalNote !== null ||
    (entry.kind === 'stay' && draft.expiresAt > entry.context.expiresAt) ||
    (entry.kind === 'qr' && (draft.author.company !== input.company ||
      draft.author.department !== input.department || draft.author.phone !== input.phone))
  )
    throw invalidGuestDraftResponse();
  // The server captures the active template when starting. Its ID/version may
  // legitimately differ from the earlier guest-home preview.
  return { draft, accessToken: response.accessToken, url: response.url, expiresAt: response.expiresAt };
}

export function verifySavedGuestDraft(
  saved: GuestDraftDto,
  previous: GuestDraftDto,
  answers: GuestDraftAnswers,
): void {
  if (
    saved.id !== previous.id || saved.property.id !== previous.property.id ||
    saved.type !== previous.type || saved.visitDate !== previous.visitDate ||
    saved.createdAt !== previous.createdAt || saved.expiresAt !== previous.expiresAt ||
    saved.updatedAt <= previous.updatedAt ||
    JSON.stringify(saved.author) !== JSON.stringify(previous.author) ||
    JSON.stringify(saved.template) !== JSON.stringify(previous.template) ||
    !sameGuestDraftAnswers(saved.answers, answers)
  )
    throw invalidGuestDraftResponse();
}
