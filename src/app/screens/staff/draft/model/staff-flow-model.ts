import type { StaffDraftDto } from '../../../../features/staff-drafts/staff-drafts.types';
import type { StaffDraftPhotoDto } from '../../../../features/staff-draft-photos/staff-draft-photos.types';
import type { StaffSubmissionPhotoInput } from '../../../../features/staff-submissions/staff-submissions.types';
import { prepareStaffSubmissionPhotos } from '../../../../features/staff-submissions/staff-submissions-validation';

export type StaffPhotoAssignment = {
  purpose: StaffSubmissionPhotoInput['purpose'];
  location: string;
};
export const staffPhotoPurposes = {
  MAINTENANCE_AFTER: '정비 후 모습',
  MAINTENANCE_BEFORE: '정비 전 모습',
  DEFECT: '발견한 문제',
  REPAIR: '수리한 모습',
} as const;

export function staffPhotoLocations(
  draft: StaffDraftDto,
  purpose: StaffPhotoAssignment['purpose'],
) {
  return draft.template.definition.sections.flatMap((section) => {
    const general =
      purpose === 'MAINTENANCE_AFTER' || purpose === 'MAINTENANCE_BEFORE';
    const items = section.items.filter(
      (item) =>
        general ||
        draft.answers.items.some(
          (answer) =>
            answer.itemId === item.id &&
            answer.value === 'ABNORMAL' &&
            (purpose !== 'REPAIR' || answer.repairReported),
        ),
    );
    return [
      ...(general
        ? [{ value: `section:${section.id}`, label: section.title }]
        : []),
      ...items.map((item) => ({
        value: `item:${item.id}`,
        label: `${section.title} · ${item.label}`,
      })),
    ];
  });
}

export function staffPhotoInputs(
  draft: StaffDraftDto,
  photos: StaffDraftPhotoDto[],
  assignments: Record<string, StaffPhotoAssignment>,
): StaffSubmissionPhotoInput[] {
  return prepareStaffSubmissionPhotos(
    draft,
    photos.map((photo, index) => {
      const assignment = assignments[photo.id];
      const valid =
        assignment &&
        staffPhotoLocations(draft, assignment.purpose).some(
          (location) => location.value === assignment.location,
        );
      if (!valid)
        throw new Error(`사진 ${index + 1}의 종류와 위치를 선택해 주세요.`);
      const [kind, id] = assignment.location.split(':');
      return {
        attachmentId: photo.id,
        purpose: assignment.purpose,
        sectionId: kind === 'section' ? id : null,
        itemId: kind === 'item' ? id : null,
        areaLabel: null,
      };
    }),
  );
}

export function sameStaffPhotoList(
  left: StaffDraftPhotoDto[],
  right: StaffDraftPhotoDto[],
) {
  return (
    left.length === right.length &&
    left.every((photo, index) => photo.id === right[index]?.id)
  );
}
