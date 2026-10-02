import type { GuestChecklistDefinition } from '../guest-entry/guest-entry.types';
import { isGuestId, isGuestText } from '../guest-entry/guest-entry-validation';
import type { GuestDraftAnswers, GuestDraftDto } from './guest-drafts.types';
import {
  invalidGuestDraftInput,
  invalidGuestDraftResponse,
  normalizeDraftText,
} from './guest-drafts-validation';

export function draftObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw invalidGuestDraftResponse();
  return value as Record<string, unknown>;
}

function nullableAnswerText(value: unknown, maximum: number): string | null {
  if (value === null) return null;
  if (!isGuestText(value, maximum)) throw invalidGuestDraftResponse();
  return value;
}

export function readGuestDraftAnswers(
  value: unknown,
  definition: GuestChecklistDefinition,
): GuestDraftAnswers {
  const answers = draftObject(value);
  if (
    answers.schemaVersion !== 1 ||
    !Array.isArray(answers.items) ||
    answers.items.length > 500 ||
    Object.keys(answers).some((key) => !['schemaVersion', 'items', 'generalNote'].includes(key))
  )
    throw invalidGuestDraftResponse();
  const availableIds = new Set(
    definition.sections.flatMap((section) => section.items.map((item) => item.id)),
  );
  const usedIds = new Set<string>();
  return {
    schemaVersion: 1,
    items: answers.items.map((value: unknown) => {
      const answer = draftObject(value);
      if (
        !isGuestId(answer.itemId) ||
        !availableIds.has(answer.itemId.toLowerCase()) ||
        usedIds.has(answer.itemId.toLowerCase()) ||
        (answer.value !== 'NORMAL' && answer.value !== 'ABNORMAL') ||
        typeof answer.isUrgent !== 'boolean' ||
        answer.repairReported !== false ||
        answer.repairNote !== null ||
        Object.keys(answer).some(
          (key) => !['itemId', 'value', 'description', 'isUrgent', 'repairReported', 'repairNote'].includes(key),
        )
      )
        throw invalidGuestDraftResponse();
      const itemId = answer.itemId.toLowerCase();
      usedIds.add(itemId);
      const description = nullableAnswerText(answer.description, 2000);
      if (answer.value === 'NORMAL' && (description !== null || answer.isUrgent))
        throw invalidGuestDraftResponse();
      return {
        itemId,
        value: answer.value,
        description,
        isUrgent: answer.isUrgent,
        repairReported: false,
        repairNote: null,
      };
    }),
    generalNote: nullableAnswerText(answers.generalNote, 4000),
  };
}

export function prepareGuestDraftAnswers(
  draft: GuestDraftDto,
  input: GuestDraftAnswers,
): GuestDraftAnswers {
  // Normalize draft text like the backend, then apply its snapshot membership,
  // duplicate-item and NORMAL/ABNORMAL rules before any mutation request.
  try {
    if (!input || input.schemaVersion !== 1 || !Array.isArray(input.items) || input.items.length > 500)
      throw invalidGuestDraftInput('체크 결과의 형식을 확인해 주세요.');
    return readGuestDraftAnswers(
      {
        ...input,
        items: input.items.map((answer) => ({
          ...answer,
          description: normalizeDraftText(answer?.description, 2000, '이상 내용'),
        })),
        generalNote: normalizeDraftText(input.generalNote, 4000, '전체 메모'),
      },
      draft.template.definition,
    );
  } catch {
    throw invalidGuestDraftInput('체크 결과와 메모를 확인해 주세요. 이상 내용은 2000자, 전체 메모는 4000자까지 입력할 수 있습니다.');
  }
}

export function sameGuestDraftAnswers(a: GuestDraftAnswers, b: GuestDraftAnswers): boolean {
  if (a.generalNote !== b.generalNote || a.items.length !== b.items.length) return false;
  const byId = new Map(a.items.map((answer) => [answer.itemId, answer]));
  return b.items.every((answer) => {
    const previous = byId.get(answer.itemId);
    return previous !== undefined && previous.value === answer.value &&
      previous.description === answer.description && previous.isUrgent === answer.isUrgent &&
      previous.repairReported === answer.repairReported && previous.repairNote === answer.repairNote;
  });
}
