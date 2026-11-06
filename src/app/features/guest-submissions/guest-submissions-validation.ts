import { ApiRequestError } from '../../core/api/api-error';
import type { GuestDraftDto } from '../guest-drafts/guest-drafts.types';
import { isGuestId } from '../guest-entry/guest-entry-validation';
import { GUEST_PHOTO_MAX_COUNT } from '../guest-draft-photos/guest-draft-photos-validation';
import type { GuestSubmissionPhotoInput } from './guest-submissions.types';

export function invalidGuestSubmissionResponse(): ApiRequestError {
  return new ApiRequestError(
    '제출 결과를 확인할 수 없습니다. 다시 제출하기 전에 제출 상태를 확인해 주세요.',
    200,
    'INVALID_GUEST_SUBMISSION_RESPONSE',
  );
}

export function assertGuestChecklistComplete(draft: GuestDraftDto): void {
  const answeredIds = new Set(
    draft.answers.items.map((answer) => answer.itemId.toLowerCase()),
  );
  if (
    draft.template.definition.sections.some((section) =>
      section.items.some(
        (item) => item.required && !answeredIds.has(item.id.toLowerCase()),
      ),
    )
  )
    throw new ApiRequestError(
      '필수 체크 항목을 모두 작성한 뒤 제출해 주세요.',
      400,
      'INCOMPLETE_CHECKLIST',
    );
}

export function prepareGuestSubmissionPhotos(
  draft: GuestDraftDto,
  photos: GuestSubmissionPhotoInput[],
): GuestSubmissionPhotoInput[] {
  function invalidPhotos(): never {
    throw new ApiRequestError(
      draft.type === 'CHECK_IN'
        ? '각 사진의 용도를 확인해 주세요. 이상 사진은 해당 이상 항목을 선택해 주세요.'
        : '사진마다 이상 항목을 연결해 주세요. 정상 항목에는 사진을 연결할 수 없습니다.',
      400,
      'INVALID_SUBMISSION_PHOTOS',
    );
  }
  if (!Array.isArray(photos) || photos.length > GUEST_PHOTO_MAX_COUNT)
    return invalidPhotos();
  const abnormalIds = new Set(
    draft.answers.items
      .filter((answer) => answer.value === 'ABNORMAL')
      .map((answer) => answer.itemId.toLowerCase()),
  );
  const used = new Set<string>();
  return photos.map((photo) => {
    if (
      !photo ||
      typeof photo !== 'object' ||
      Array.isArray(photo) ||
      !isGuestId(photo.attachmentId)
    )
      return invalidPhotos();
    const attachmentId = photo.attachmentId.toLowerCase();
    if (used.has(attachmentId)) return invalidPhotos();
    used.add(attachmentId);
    const keys = Object.keys(photo);
    if (photo.purpose === 'ROOM_CONDITION') {
      if (
        draft.type !== 'CHECK_IN' ||
        keys.some((key) => key !== 'attachmentId' && key !== 'purpose')
      )
        return invalidPhotos();
      return { attachmentId, purpose: 'ROOM_CONDITION' };
    }
    if (
      photo.purpose !== 'DEFECT' ||
      !isGuestId(photo.itemId) ||
      keys.some((key) => !['attachmentId', 'purpose', 'itemId'].includes(key))
    )
      return invalidPhotos();
    const itemId = photo.itemId.toLowerCase();
    if (!abnormalIds.has(itemId)) return invalidPhotos();
    return { attachmentId, purpose: 'DEFECT', itemId };
  });
}
