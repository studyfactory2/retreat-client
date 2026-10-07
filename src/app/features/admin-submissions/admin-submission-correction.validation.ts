import { ApiRequestError } from '../../core/api/api-error';
import type { AdminSubmissionDetail } from './admin-submissions.types';
import type {
  AdminSubmissionCorrectionEffect,
  AdminSubmissionCorrectionInput,
  AdminSubmissionCorrectionItem,
} from './admin-submission-correction.types';
import { isSubmissionId } from './admin-submissions-validation';

export const ADMIN_CORRECTION_REASON_LIMIT = 1000;
export const ADMIN_CORRECTION_DESCRIPTION_LIMIT = 2000;
export const ADMIN_CORRECTION_NOTE_LIMIT = 4000;

function invalid(field: string, message: string): never {
  throw new ApiRequestError(message, 400, 'INVALID_SUBMISSION_CORRECTION', [
    { field, messages: [message] },
  ]);
}

function object(
  value: unknown,
  keys: readonly string[],
  field: string,
): Record<string, unknown> {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).some((key) => !keys.includes(key))
  )
    return invalid(field, '정정할 입력 항목을 확인해 주세요.');
  return value as Record<string, unknown>;
}

function text(
  value: unknown,
  max: number,
  field: string,
  optional = false,
): string | null {
  if (value === null || (optional && value === undefined)) return null;
  if (typeof value !== 'string')
    return invalid(field, '내용을 문자열로 입력해 주세요.');
  const normalized = value.trim();
  if ([...normalized].length > max)
    return invalid(field, `내용은 ${max}자 이하여야 합니다.`);
  return normalized || null;
}

export function prepareAdminSubmissionCorrection(
  detail: AdminSubmissionDetail,
  input: AdminSubmissionCorrectionInput,
): AdminSubmissionCorrectionInput {
  const data = object(
    input,
    ['expectedRevision', 'items', 'generalNote', 'reason'],
    'input',
  );
  if (
    detail.status !== 'SUBMITTED' ||
    !Number.isInteger(data.expectedRevision) ||
    (data.expectedRevision as number) < 1 ||
    (data.expectedRevision as number) > 2_147_483_646 ||
    data.expectedRevision !== detail.currentRevision
  )
    return invalid(
      'expectedRevision',
      '최신 제출 기록을 확인한 뒤 정정해 주세요.',
    );
  const reason = text(data.reason, ADMIN_CORRECTION_REASON_LIMIT, 'reason');
  if (!reason)
    return invalid(
      'reason',
      '정정 사유를 1자 이상 1000자 이하로 입력해 주세요.',
    );
  const generalNote = text(
    data.generalNote,
    ADMIN_CORRECTION_NOTE_LIMIT,
    'generalNote',
  );
  if (!Array.isArray(data.items) || data.items.length > 500)
    return invalid('items', '체크리스트 답변을 확인해 주세요.');
  const definition =
    detail.revision.record.template.definition.sections.flatMap(
      (section) => section.items,
    );
  const available = new Map(
    definition.map((item, index) => [item.id, { ...item, index }]),
  );
  const used = new Set<string>();
  const items: AdminSubmissionCorrectionItem[] = data.items
    .map((value: unknown): AdminSubmissionCorrectionItem => {
      const item = object(
        value,
        ['itemId', 'value', 'description', 'isUrgent'],
        'items',
      );
      if (!isSubmissionId(item.itemId) || item.itemId.length !== 36)
        return invalid('items', '체크 항목을 확인해 주세요.');
      const itemId = item.itemId.toLowerCase();
      if (!available.has(itemId) || used.has(itemId))
        return invalid(
          'items',
          '저장된 양식의 항목을 중복 없이 선택해 주세요.',
        );
      used.add(itemId);
      if (item.value !== 'NORMAL' && item.value !== 'ABNORMAL')
        return invalid(itemId, '정상 또는 이상을 선택해 주세요.');
      const description = text(
        item.description,
        ADMIN_CORRECTION_DESCRIPTION_LIMIT,
        itemId,
        true,
      );
      if (item.isUrgent !== undefined && typeof item.isUrgent !== 'boolean')
        return invalid(itemId, '긴급 여부를 확인해 주세요.');
      const isUrgent =
        item.isUrgent === undefined ? false : (item.isUrgent as boolean);
      if (item.value === 'NORMAL' && (description !== null || isUrgent))
        return invalid(
          itemId,
          '정상 답변에는 이상 내용이나 긴급 표시를 남길 수 없습니다.',
        );
      return { itemId, value: item.value, description, isUrgent };
    })
    .sort(
      (a, b) => available.get(a.itemId)!.index - available.get(b.itemId)!.index,
    );
  const missing = definition.find(
    (item) => item.required && !used.has(item.id),
  );
  if (missing) return invalid(missing.id, '필수 체크 항목에 답변해 주세요.');
  return Object.freeze({
    expectedRevision: data.expectedRevision as number,
    items: Object.freeze(items.map((item) => Object.freeze(item))),
    generalNote,
    reason,
  });
}

// Derive the server's deterministic consequences from the captured revision.
// The request never accepts repair or photo edits from this administrator UI.
export function adminSubmissionCorrectionEffect(
  detail: AdminSubmissionDetail,
  input: AdminSubmissionCorrectionInput,
): AdminSubmissionCorrectionEffect {
  const record = detail.revision.record;
  const prior = new Map(
    record.answers.items.map((answer) => [answer.itemId, answer]),
  );
  const answers = {
    schemaVersion: 1 as const,
    items: input.items.map((item) => {
      const before = prior.get(item.itemId);
      const keepRepair =
        record.type === 'MAINTENANCE' && item.value === 'ABNORMAL';
      return {
        itemId: item.itemId,
        value: item.value,
        description: item.description ?? null,
        isUrgent: item.isUrgent ?? false,
        repairReported: keepRepair ? (before?.repairReported ?? false) : false,
        repairNote: keepRepair ? (before?.repairNote ?? null) : null,
      };
    }),
    generalNote: input.generalNote,
  };
  const current = new Map(
    answers.items.map((answer) => [answer.itemId, answer]),
  );
  const removedPhotos = detail.revision.photos.filter((photo) => {
    const answer =
      photo.itemId === null ? undefined : current.get(photo.itemId);
    if (photo.purpose === 'DEFECT') return answer?.value !== 'ABNORMAL';
    if (photo.purpose === 'REPAIR')
      return answer?.value !== 'ABNORMAL' || !answer.repairReported;
    return false;
  });
  const removedIds = new Set(removedPhotos.map((photo) => photo.id));
  const photos = detail.revision.photos
    .filter((photo) => !removedIds.has(photo.id))
    .map((photo, sortOrder) => ({ ...photo, sortOrder }));
  const clearedRepairs = record.answers.items.filter(
    (answer) =>
      answer.repairReported && current.get(answer.itemId)?.value !== 'ABNORMAL',
  );
  const changed =
    record.answers.generalNote !== answers.generalNote ||
    prior.size !== current.size ||
    answers.items.some((answer) => {
      const before = prior.get(answer.itemId);
      return (
        !before ||
        answer.value !== before.value ||
        answer.description !== before.description ||
        answer.isUrgent !== before.isUrgent ||
        answer.repairReported !== before.repairReported ||
        answer.repairNote !== before.repairNote
      );
    });
  return { answers, photos, removedPhotos, clearedRepairs, changed };
}
