import { ApiRequestError } from '../../core/api/api-error';
import {
  readGuestDraftAnswers,
  sameGuestDraftAnswers,
} from '../guest-drafts/guest-draft-answers';
import type { GuestDraftAnswers } from '../guest-drafts/guest-drafts.types';
import { normalizeDraftText } from '../guest-drafts/guest-drafts-validation';
import { readGuestSubmissionDetail } from './guest-submission-details-readers';
import type {
  GuestCorrectionInput,
  GuestSubmissionDetailDto,
} from './guest-submission-details.types';

export const GUEST_CORRECTION_MAX_BASE_REVISION = 2_147_483_646;

export function invalidGuestCorrectionInput(
  message = '수정할 체크 결과와 메모를 확인해 주세요.',
): ApiRequestError {
  return new ApiRequestError(message, 400, 'INVALID_GUEST_CORRECTION_INPUT');
}

function normalizedAnswers(
  base: GuestSubmissionDetailDto,
  input: GuestDraftAnswers,
): GuestDraftAnswers {
  try {
    if (
      !input ||
      input.schemaVersion !== 1 ||
      !Array.isArray(input.items) ||
      input.items.length > 500
    )
      throw invalidGuestCorrectionInput();
    const answers = readGuestDraftAnswers(
      {
        ...input,
        items: input.items.map((answer) => ({
          ...answer,
          description: normalizeDraftText(
            answer?.description,
            2000,
            '이상 내용',
          ),
        })),
        generalNote: normalizeDraftText(input.generalNote, 4000, '전체 메모'),
      },
      base.template.definition,
    );
    const order = new Map(
      base.template.definition.sections
        .flatMap((section) => section.items)
        .map((item, index) => [item.id, index]),
    );
    answers.items.sort(
      (left, right) => order.get(left.itemId)! - order.get(right.itemId)!,
    );
    return answers;
  } catch {
    throw invalidGuestCorrectionInput(
      '체크 결과와 메모를 확인해 주세요. 이상 내용은 2000자, 전체 메모는 4000자까지 입력할 수 있습니다.',
    );
  }
}

export function prepareGuestCorrection(
  base: GuestSubmissionDetailDto,
  input: GuestDraftAnswers,
  reason: string,
): GuestCorrectionInput {
  const captured = readGuestSubmissionDetail(base);
  if (captured.revision > GUEST_CORRECTION_MAX_BASE_REVISION)
    throw invalidGuestCorrectionInput(
      '더 이상 수정할 수 없는 제출 버전입니다. 관리자에게 문의해 주세요.',
    );
  const answers = normalizedAnswers(captured, input);
  const answeredIds = new Set(answers.items.map((answer) => answer.itemId));
  if (
    captured.template.definition.sections.some((section) =>
      section.items.some((item) => item.required && !answeredIds.has(item.id)),
    )
  )
    throw new ApiRequestError(
      '필수 체크 항목을 모두 작성한 뒤 저장해 주세요.',
      400,
      'INCOMPLETE_CHECKLIST',
    );
  let normalizedReason: string | null;
  try {
    if (typeof reason !== 'string') throw invalidGuestCorrectionInput();
    normalizedReason = normalizeDraftText(reason, 1000, '수정 사유');
  } catch {
    throw invalidGuestCorrectionInput(
      '수정 사유는 1000자 이하로 입력해 주세요.',
    );
  }
  // Explicit projection keeps staff-only fields and all identity/photo metadata
  // out of the mutation, including when a caller supplies a richer object.
  return {
    expectedRevision: captured.revision,
    items: answers.items.map(({ itemId, value, description, isUrgent }) => ({
      itemId,
      value,
      description,
      isUrgent,
    })),
    generalNote: answers.generalNote,
    ...(normalizedReason === null ? {} : { reason: normalizedReason }),
  };
}

export function sameGuestCorrectionAnswers(
  base: GuestSubmissionDetailDto,
  input: GuestDraftAnswers,
): boolean {
  try {
    return sameGuestDraftAnswers(base.answers, normalizedAnswers(base, input));
  } catch {
    return false;
  }
}

export function readPreparedGuestCorrection(
  base: GuestSubmissionDetailDto,
  input: GuestCorrectionInput,
): GuestCorrectionInput {
  if (
    !input ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    input.expectedRevision !== base.revision ||
    Object.keys(input).some(
      (key) =>
        !['expectedRevision', 'items', 'generalNote', 'reason'].includes(key),
    ) ||
    !Array.isArray(input.items) ||
    input.items.length > 500 ||
    (input.generalNote !== null && typeof input.generalNote !== 'string') ||
    input.items.some(
      (answer) =>
        !answer ||
        typeof answer !== 'object' ||
        Array.isArray(answer) ||
        Object.keys(answer).some(
          (key) =>
            !['itemId', 'value', 'description', 'isUrgent'].includes(key),
        ),
    )
  )
    throw invalidGuestCorrectionInput();
  return prepareGuestCorrection(
    base,
    {
      schemaVersion: 1,
      items: input.items.map((answer) => ({
        ...answer,
        repairReported: false,
        repairNote: null,
      })),
      generalNote: input.generalNote,
    },
    input.reason === undefined ? '' : input.reason,
  );
}
