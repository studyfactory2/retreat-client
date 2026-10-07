import { adminSubmissionCorrectionEffect } from '../../../../features/admin-submissions/admin-submission-correction.validation';
import type { AdminSubmissionCorrectionInput } from '../../../../features/admin-submissions/admin-submission-correction.types';
import type {
  AdminSubmissionAnswer,
  AdminSubmissionDetail,
} from '../../../../features/admin-submissions/admin-submissions.types';

export type CorrectionAnswer = Pick<
  AdminSubmissionAnswer,
  'itemId' | 'value' | 'description' | 'isUrgent'
>;
export interface SubmissionCorrectionForm {
  items: CorrectionAnswer[];
  generalNote: string;
  reason: string;
}

export function submissionCorrectionForm(
  detail: AdminSubmissionDetail,
): SubmissionCorrectionForm {
  return {
    items: detail.revision.record.answers.items.map((answer) => ({
      itemId: answer.itemId,
      value: answer.value,
      description: answer.description,
      isUrgent: answer.isUrgent,
    })),
    generalNote: detail.revision.record.answers.generalNote ?? '',
    reason: '',
  };
}

export function changeCorrectionAnswer(
  form: SubmissionCorrectionForm,
  itemId: string,
  value: CorrectionAnswer['value'] | null,
): SubmissionCorrectionForm {
  const previous = form.items.find((answer) => answer.itemId === itemId);
  if (previous?.value === value) return form;
  const items = form.items.filter((answer) => answer.itemId !== itemId);
  if (value !== null)
    items.push({ itemId, value, description: null, isUrgent: false });
  return { ...form, items };
}

export function changeCorrectionDetails(
  form: SubmissionCorrectionForm,
  itemId: string,
  change: Partial<Pick<CorrectionAnswer, 'description' | 'isUrgent'>>,
): SubmissionCorrectionForm {
  return {
    ...form,
    items: form.items.map((answer) =>
      answer.itemId === itemId && answer.value === 'ABNORMAL'
        ? { ...answer, ...change }
        : answer,
    ),
  };
}

export function dirtySubmissionCorrection(
  detail: AdminSubmissionDetail,
  form: SubmissionCorrectionForm,
): boolean {
  const original = submissionCorrectionForm(detail);
  return (
    form.reason.length > 0 ||
    form.generalNote !== original.generalNote ||
    form.items.length !== original.items.length ||
    original.items.some((before) => {
      const after = form.items.find((item) => item.itemId === before.itemId);
      return (
        !after ||
        before.value !== after.value ||
        before.description !== after.description ||
        before.isUrgent !== after.isUrgent
      );
    })
  );
}

export function correctionConsequences(
  detail: AdminSubmissionDetail,
  input: AdminSubmissionCorrectionInput,
) {
  const record = detail.revision.record;
  const effect = adminSubmissionCorrectionEffect(detail, input);
  const items = effect.answers.items;
  const generalNote = effect.answers.generalNote;
  const changes = record.template.definition.sections.flatMap((section) =>
    section.items.flatMap((item) => {
      const before = record.answers.items.find(
        (answer) => answer.itemId === item.id,
      );
      const after = items.find((answer) => answer.itemId === item.id);
      const changed =
        before?.value !== after?.value ||
        before?.description !== after?.description ||
        before?.isUrgent !== after?.isUrgent;
      return changed ? [{ item, section: section.title, before, after }] : [];
    }),
  );
  return {
    changes,
    removedRepair: effect.clearedRepairs,
    removedPhotos: effect.removedPhotos,
    noteChanged: generalNote !== record.answers.generalNote,
    changed: effect.changed,
  };
}
