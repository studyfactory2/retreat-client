import type { StaffChecklistDefinition } from '../staff-entry/staff-entry.types';
import {
  isStaffEntryId,
  isStaffEntryText,
} from '../staff-entry/staff-entry-validation';
import type { StaffDraftAnswers, StaffDraftDto } from './staff-drafts.types';
import {
  invalidStaffDraftInput,
  invalidStaffDraftResponse,
  normalizeStaffDraftText,
  staffDraftObject,
} from './staff-drafts-validation';

function nullableAnswerText(value: unknown, maximum: number): string | null {
  if (value === null) return null;
  if (!isStaffEntryText(value, maximum)) throw invalidStaffDraftResponse();
  return value;
}

export function readStaffDraftAnswers(
  value: unknown,
  definition: StaffChecklistDefinition,
): StaffDraftAnswers {
  const answers = staffDraftObject(value);
  if (
    answers.schemaVersion !== 1 ||
    !Array.isArray(answers.items) ||
    answers.items.length > 500 ||
    Object.keys(answers).some(
      (key) => !['schemaVersion', 'items', 'generalNote'].includes(key),
    )
  )
    throw invalidStaffDraftResponse();
  const availableIds = new Set(
    definition.sections.flatMap((section) =>
      section.items.map((item) => item.id),
    ),
  );
  const usedIds = new Set<string>();
  return {
    schemaVersion: 1,
    items: Array.from(answers.items, (value: unknown) => {
      const answer = staffDraftObject(value);
      if (
        !isStaffEntryId(answer.itemId) ||
        !availableIds.has(answer.itemId.toLowerCase()) ||
        usedIds.has(answer.itemId.toLowerCase()) ||
        (answer.value !== 'NORMAL' && answer.value !== 'ABNORMAL') ||
        typeof answer.isUrgent !== 'boolean' ||
        typeof answer.repairReported !== 'boolean' ||
        Object.keys(answer).some(
          (key) =>
            ![
              'itemId',
              'value',
              'description',
              'isUrgent',
              'repairReported',
              'repairNote',
            ].includes(key),
        )
      )
        throw invalidStaffDraftResponse();
      const itemId = answer.itemId.toLowerCase();
      usedIds.add(itemId);
      const description = nullableAnswerText(answer.description, 2000);
      const repairNote = nullableAnswerText(answer.repairNote, 2000);
      if (
        (repairNote !== null && !answer.repairReported) ||
        (answer.value === 'NORMAL' &&
          (description !== null ||
            answer.isUrgent ||
            answer.repairReported ||
            repairNote !== null))
      )
        throw invalidStaffDraftResponse();
      return {
        itemId,
        value: answer.value,
        description,
        isUrgent: answer.isUrgent,
        repairReported: answer.repairReported,
        repairNote,
      };
    }),
    generalNote: nullableAnswerText(answers.generalNote, 4000),
  };
}

export function prepareStaffDraftAnswers(
  draft: StaffDraftDto,
  input: StaffDraftAnswers,
): StaffDraftAnswers {
  try {
    const answers = staffDraftObject(input);
    if (
      answers.schemaVersion !== 1 ||
      !Array.isArray(answers.items) ||
      answers.items.length > 500
    )
      throw invalidStaffDraftInput('체크 결과의 형식을 확인해 주세요.');
    return readStaffDraftAnswers(
      {
        ...answers,
        items: Array.from(answers.items, (value: unknown) => {
          const answer = staffDraftObject(value);
          // The editor carries the complete saved answer. An omitted hidden
          // repair field must not silently clear an existing worker's claim.
          if (answer.repairNote === undefined)
            throw invalidStaffDraftInput('저장된 조치 내용을 확인해 주세요.');
          return {
            ...answer,
            description: normalizeStaffDraftText(answer.description, 2000),
            repairNote: normalizeStaffDraftText(answer.repairNote, 2000),
          };
        }),
        generalNote: normalizeStaffDraftText(answers.generalNote, 4000),
      },
      draft.template.definition,
    );
  } catch {
    throw invalidStaffDraftInput(
      '체크 결과와 메모를 확인해 주세요. 이상·조치 내용은 각각 2000자, 전체 메모는 4000자까지 입력할 수 있습니다.',
    );
  }
}

export function sameStaffDraftAnswers(
  a: StaffDraftAnswers,
  b: StaffDraftAnswers,
): boolean {
  if (a.generalNote !== b.generalNote || a.items.length !== b.items.length)
    return false;
  const byId = new Map(a.items.map((answer) => [answer.itemId, answer]));
  return b.items.every((answer) => {
    const previous = byId.get(answer.itemId);
    return (
      previous !== undefined &&
      previous.value === answer.value &&
      previous.description === answer.description &&
      previous.isUrgent === answer.isUrgent &&
      previous.repairReported === answer.repairReported &&
      previous.repairNote === answer.repairNote
    );
  });
}
