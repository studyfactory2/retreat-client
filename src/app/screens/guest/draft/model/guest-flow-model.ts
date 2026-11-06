import type { GuestDraftDto } from '../../../../features/guest-drafts/guest-drafts.types';
import type { GuestDraftPhotoDto } from '../../../../features/guest-draft-photos/guest-draft-photos.types';
import { prepareGuestSubmissionPhotos } from '../../../../features/guest-submissions/guest-submissions-validation';

export const ROOM_PHOTO = 'ROOM_CONDITION';

export type GuestFlowStep = 0 | 1 | 2;

export function guestPhotoInputs(
  draft: GuestDraftDto,
  photos: GuestDraftPhotoDto[],
  assignments: Record<string, string>,
) {
  return prepareGuestSubmissionPhotos(
    draft,
    photos.map((photo) => {
      const target = assignments[photo.id];
      return target === ROOM_PHOTO
        ? { attachmentId: photo.id, purpose: ROOM_PHOTO }
        : { attachmentId: photo.id, purpose: 'DEFECT', itemId: target ?? '' };
    }),
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
