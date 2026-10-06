import { ApiRequestError } from '../../core/api/api-error';
import { STAFF_PHOTO_MAX_COUNT } from '../staff-draft-photos/staff-draft-photos-validation';
import { prepareStaffDraftAnswers } from '../staff-drafts/staff-draft-answers';
import { readStaffDraft } from '../staff-drafts/staff-drafts-readers';
import type { StaffDraftDto } from '../staff-drafts/staff-drafts.types';
import { isStaffEntryId } from '../staff-entry/staff-entry-validation';
import type {
  StaffSubmissionPhotoInput,
  StaffSubmissionPhotoPurpose,
} from './staff-submissions.types';

export function invalidStaffSubmissionResponse(): ApiRequestError {
  return new ApiRequestError(
    '정비 제출 결과를 확인할 수 없습니다. 다시 제출하기 전에 제출 상태를 확인해 주세요.',
    200,
    'INVALID_STAFF_SUBMISSION_RESPONSE',
  );
}

function readPreparedDraft(draft: StaffDraftDto): StaffDraftDto {
  // Review runs before saving and can receive raw textarea values. Normalize
  // empty/whitespace notes exactly as save does without changing the editor.
  return readStaffDraft({
    ...draft,
    answers: prepareStaffDraftAnswers(draft, draft.answers),
  });
}

export function assertStaffChecklistComplete(draft: StaffDraftDto): void {
  const base = readPreparedDraft(draft);
  const answeredIds = new Set(
    base.answers.items.map((answer) => answer.itemId),
  );
  if (
    base.template.definition.sections.some((section) =>
      section.items.some((item) => item.required && !answeredIds.has(item.id)),
    )
  )
    throw new ApiRequestError(
      '필수 체크 항목을 모두 작성한 뒤 제출해 주세요.',
      400,
      'INCOMPLETE_CHECKLIST',
    );
}

function invalidPhotos(): never {
  throw new ApiRequestError(
    '사진 용도와 연결된 체크 항목 또는 위치를 확인해 주세요. 수리 사진은 조치를 보고한 이상 항목에 연결해 주세요.',
    400,
    'INVALID_SUBMISSION_PHOTOS',
  );
}

function nullableId(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (!isStaffEntryId(value)) return invalidPhotos();
  return value.toLowerCase();
}

function areaLabel(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return invalidPhotos();
  const label = value.trim();
  if ([...label].length > 150) return invalidPhotos();
  return label || null;
}

const purposes: readonly StaffSubmissionPhotoPurpose[] = [
  'DEFECT',
  'REPAIR',
  'MAINTENANCE_BEFORE',
  'MAINTENANCE_AFTER',
];

export function prepareStaffSubmissionPhotos(
  draft: StaffDraftDto,
  photos: StaffSubmissionPhotoInput[],
): StaffSubmissionPhotoInput[] {
  const base = readPreparedDraft(draft);
  if (!Array.isArray(photos) || photos.length > STAFF_PHOTO_MAX_COUNT)
    return invalidPhotos();
  const sectionIds = new Set(
    base.template.definition.sections.map((section) => section.id),
  );
  const itemSections = new Map(
    base.template.definition.sections.flatMap((section) =>
      section.items.map((item) => [item.id, section.id] as const),
    ),
  );
  const answers = new Map(
    base.answers.items.map((answer) => [answer.itemId, answer]),
  );
  const used = new Set<string>();
  // Preserve order and normalize IDs/empty location values exactly as the API
  // does. An intentional replay must keep this order and the saved timestamp.
  return Array.from(photos, (photo) => {
    if (
      !photo ||
      typeof photo !== 'object' ||
      Array.isArray(photo) ||
      !isStaffEntryId(photo.attachmentId) ||
      !purposes.includes(photo.purpose) ||
      Object.keys(photo).some(
        (key) =>
          ![
            'attachmentId',
            'purpose',
            'sectionId',
            'itemId',
            'areaLabel',
          ].includes(key),
      )
    )
      return invalidPhotos();
    const attachmentId = photo.attachmentId.toLowerCase();
    if (used.has(attachmentId)) return invalidPhotos();
    used.add(attachmentId);
    let sectionId = nullableId(photo.sectionId);
    const itemId = nullableId(photo.itemId);
    const location = areaLabel(photo.areaLabel);
    if (sectionId !== null && !sectionIds.has(sectionId))
      return invalidPhotos();
    if (itemId !== null) {
      const itemSection = itemSections.get(itemId);
      if (!itemSection || (sectionId !== null && sectionId !== itemSection))
        return invalidPhotos();
      sectionId = itemSection;
    }
    const answer = itemId === null ? undefined : answers.get(itemId);
    if (
      (photo.purpose === 'DEFECT' && answer?.value !== 'ABNORMAL') ||
      (photo.purpose === 'REPAIR' &&
        (answer?.value !== 'ABNORMAL' || !answer.repairReported)) ||
      ((photo.purpose === 'MAINTENANCE_BEFORE' ||
        photo.purpose === 'MAINTENANCE_AFTER') &&
        sectionId === null &&
        itemId === null &&
        location === null)
    )
      return invalidPhotos();
    return {
      attachmentId,
      purpose: photo.purpose,
      sectionId,
      itemId,
      areaLabel: location,
    };
  });
}
