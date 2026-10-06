import { appConfig } from '../../core/config/environment';
import { getSeoulToday } from '../../core/dates/seoul-date';
import { readStaffChecklistDefinition } from '../staff-entry/staff-checklist-readers';
import type { StaffQrContextDto } from '../staff-entry/staff-entry.types';
import {
  isStaffEntryId,
  isStaffEntryText,
  isStaffEntryVersion,
} from '../staff-entry/staff-entry-validation';
import {
  readStaffDraftAnswers,
  sameStaffDraftAnswers,
} from './staff-draft-answers';
import type {
  StaffDraftAnswers,
  StaffDraftDto,
  StartStaffDraftDto,
} from './staff-drafts.types';
import {
  invalidStaffDraftResponse,
  isStaffDraftDate,
  isStaffDraftTimestamp,
  isStaffDraftToken,
  staffDraftObject,
} from './staff-drafts-validation';

export function readStaffDraft(value: unknown): StaffDraftDto {
  const draft = staffDraftObject(value);
  const property = staffDraftObject(draft.property);
  const author = staffDraftObject(draft.author);
  const template = staffDraftObject(draft.template);
  if (
    !isStaffEntryId(draft.id) ||
    !isStaffEntryId(property.id) ||
    !isStaffEntryText(property.name, 100) ||
    (property.region !== null && !isStaffEntryText(property.region, 100)) ||
    draft.type !== 'MAINTENANCE' ||
    draft.status !== 'DRAFT' ||
    !isStaffDraftDate(draft.visitDate) ||
    !isStaffDraftTimestamp(draft.startedAt) ||
    !isStaffDraftTimestamp(draft.createdAt) ||
    !isStaffDraftTimestamp(draft.updatedAt) ||
    !isStaffDraftTimestamp(draft.expiresAt) ||
    draft.updatedAt < draft.createdAt ||
    draft.expiresAt <= draft.createdAt ||
    draft.expiresAt <= draft.startedAt ||
    draft.visitDate !== getSeoulToday(new Date(draft.startedAt)) ||
    author.schemaVersion !== 1 ||
    author.role !== 'STAFF' ||
    !isStaffEntryText(author.name, 100) ||
    author.company !== null ||
    author.department !== null ||
    author.phone !== null ||
    Object.keys(author).some(
      (key) =>
        ![
          'schemaVersion',
          'role',
          'name',
          'company',
          'department',
          'phone',
        ].includes(key),
    ) ||
    template.schemaVersion !== 1 ||
    !isStaffEntryId(template.id) ||
    template.type !== 'MAINTENANCE' ||
    !isStaffEntryText(template.title, 150) ||
    !isStaffEntryVersion(template.version) ||
    Object.keys(template).some(
      (key) =>
        ![
          'schemaVersion',
          'id',
          'type',
          'title',
          'version',
          'definition',
        ].includes(key),
    )
  )
    throw invalidStaffDraftResponse();
  let definition;
  try {
    definition = readStaffChecklistDefinition(template.definition);
  } catch {
    throw invalidStaffDraftResponse();
  }
  // Creation uses the database clock; startedAt and expiry use the app clock.
  // Preserve the server's expiry instead of inventing an exact creation offset.
  return {
    id: draft.id.toLowerCase(),
    property: {
      id: property.id.toLowerCase(),
      name: property.name,
      region: property.region,
    },
    type: 'MAINTENANCE',
    status: 'DRAFT',
    visitDate: draft.visitDate,
    author: {
      schemaVersion: 1,
      role: 'STAFF',
      name: author.name,
      company: null,
      department: null,
      phone: null,
    },
    template: {
      schemaVersion: 1,
      id: template.id.toLowerCase(),
      type: 'MAINTENANCE',
      title: template.title,
      version: template.version,
      definition,
    },
    answers: readStaffDraftAnswers(draft.answers, definition),
    startedAt: draft.startedAt,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
    expiresAt: draft.expiresAt,
  };
}

export function readStartedStaffDraft(
  value: unknown,
  entry: StaffQrContextDto,
): StartStaffDraftDto {
  const response = staffDraftObject(value);
  const draft = readStaffDraft(response.draft);
  if (
    !isStaffDraftToken(response.accessToken) ||
    !isStaffDraftTimestamp(response.expiresAt) ||
    response.expiresAt !== draft.expiresAt ||
    response.url !==
      `${appConfig.frontendOrigin}/draft#token=${response.accessToken}` ||
    draft.property.id !== entry.property.id.toLowerCase() ||
    draft.answers.items.length !== 0 ||
    draft.answers.generalNote !== null
  )
    throw invalidStaffDraftResponse();
  // The server enforces confirmedStaffId. Names and templates can change after
  // the QR preview, so the captured snapshot is authoritative for this draft.
  return {
    draft,
    accessToken: response.accessToken,
    url: response.url,
    expiresAt: response.expiresAt,
  };
}

export function verifySavedStaffDraft(
  saved: StaffDraftDto,
  previous: StaffDraftDto,
  answers: StaffDraftAnswers,
): void {
  if (
    saved.id !== previous.id ||
    saved.property.id !== previous.property.id ||
    saved.visitDate !== previous.visitDate ||
    saved.startedAt !== previous.startedAt ||
    saved.createdAt !== previous.createdAt ||
    saved.expiresAt !== previous.expiresAt ||
    saved.updatedAt <= previous.updatedAt ||
    JSON.stringify(saved.author) !== JSON.stringify(previous.author) ||
    JSON.stringify(saved.template) !== JSON.stringify(previous.template) ||
    !sameStaffDraftAnswers(saved.answers, answers)
  )
    throw invalidStaffDraftResponse();
}
