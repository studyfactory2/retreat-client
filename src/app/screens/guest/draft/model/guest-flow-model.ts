import type { GuestDraftDto } from '../../../../features/guest-drafts/guest-drafts.types';
import type { GuestDraftPhotoDto } from '../../../../features/guest-draft-photos/guest-draft-photos.types';
import { prepareGuestSubmissionPhotos } from '../../../../features/guest-submissions/guest-submissions-validation';

export type GuestFlowStep = 0 | 1 | 2;
export const guestFlowSteps = ['시설 확인', '사진', '제출 확인'] as const;

export function guestPhotoInputs(
  draft: GuestDraftDto,
  photos: GuestDraftPhotoDto[],
  assignments: Record<string, string>,
) {
  return prepareGuestSubmissionPhotos(
    draft,
    photos.map((photo) => ({
      attachmentId: photo.id,
      purpose: 'DEFECT',
      itemId: assignments[photo.id] ?? '',
    })),
  );
}

export function sameGuestPhotoList(
  previous: GuestDraftPhotoDto[],
  current: GuestDraftPhotoDto[],
): boolean {
  return (
    previous.length === current.length &&
    previous.every((photo, index) => photo.id === current[index]?.id)
  );
}
