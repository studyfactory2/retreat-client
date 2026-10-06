import type {
  StaffDraftAnswer,
  StaffDraftAnswers,
  StaffDraftDto,
} from '../../../../features/staff-drafts/staff-drafts.types';

export function requiresStaffAnswerDiscardConfirmation(
  answers: StaffDraftAnswers,
  itemId: string,
  value: StaffDraftAnswer['value'] | null,
): boolean {
  const previous = answers.items.find((item) => item.itemId === itemId);
  return (
    previous?.value === 'ABNORMAL' &&
    value !== 'ABNORMAL' &&
    (previous.description !== null ||
      previous.isUrgent ||
      previous.repairReported ||
      previous.repairNote !== null)
  );
}

export function changeStaffDraftAnswer(
  answers: StaffDraftAnswers,
  itemId: string,
  value: StaffDraftAnswer['value'] | null,
): StaffDraftAnswers {
  const previous = answers.items.find((item) => item.itemId === itemId);
  if (previous?.value === value || (!previous && value === null))
    return answers;
  const items = answers.items.filter((item) => item.itemId !== itemId);
  if (value !== null)
    items.push({
      itemId,
      value,
      description: null,
      isUrgent: false,
      repairReported: false,
      repairNote: null,
    });
  return { ...answers, items };
}

export function changeStaffDraftDetails(
  answers: StaffDraftAnswers,
  itemId: string,
  change: { description?: string | null; isUrgent?: boolean },
): StaffDraftAnswers {
  return {
    ...answers,
    items: answers.items.map((item) =>
      item.itemId === itemId && item.value === 'ABNORMAL'
        ? { ...item, ...change }
        : item,
    ),
  };
}

export function sameStaffDraftIdentity(
  previous: StaffDraftDto,
  next: StaffDraftDto,
): boolean {
  // Labels may change independently; author and checklist are immutable snapshots.
  return (
    previous.id === next.id &&
    previous.property.id === next.property.id &&
    previous.type === next.type &&
    previous.visitDate === next.visitDate &&
    previous.startedAt === next.startedAt &&
    previous.createdAt === next.createdAt &&
    previous.expiresAt === next.expiresAt &&
    JSON.stringify(previous.author) === JSON.stringify(next.author) &&
    JSON.stringify(previous.template) === JSON.stringify(next.template)
  );
}

export const staffDraftChangedMessage =
  '서버에 저장된 내용이 변경되었습니다. 현재 입력은 보관 중입니다. 입력을 버리고 서버 내용을 다시 불러와 확인한 뒤 작성해 주세요.';
export const staffDraftUncertainMessage =
  '저장 결과를 확인하지 못했습니다. 이미 저장되었을 수 있어 다시 저장할 수 없습니다. 서버 내용을 다시 불러와 확인해 주세요.';
