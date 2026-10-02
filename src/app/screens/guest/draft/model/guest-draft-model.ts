import type {
  GuestDraftAnswer,
  GuestDraftAnswers,
} from '../../../../features/guest-drafts/guest-drafts.types';
import { sameGuestDraftAnswers } from '../../../../features/guest-drafts/guest-draft-answers';

export function sameDraftAnswers(left: GuestDraftAnswers, right: GuestDraftAnswers): boolean {
  return sameGuestDraftAnswers(left, right);
}

export function changeDraftAnswer(
  answers: GuestDraftAnswers,
  itemId: string,
  value: GuestDraftAnswer['value'] | null,
): GuestDraftAnswers {
  const previous = answers.items.find((item) => item.itemId === itemId);
  if (previous?.value === value || (!previous && value === null)) return answers;
  const items = answers.items.filter((item) => item.itemId !== itemId);
  if (value !== null) items.push({
    itemId,
    value,
    description: value === 'ABNORMAL' ? previous?.description ?? null : null,
    isUrgent: value === 'ABNORMAL' ? previous?.isUrgent ?? false : false,
    repairReported: false,
    repairNote: null,
  });
  return { ...answers, items };
}

export function changeDraftDetails(
  answers: GuestDraftAnswers,
  itemId: string,
  change: { description?: string | null; isUrgent?: boolean },
): GuestDraftAnswers {
  return {
    ...answers,
    items: answers.items.map((item) => item.itemId === itemId && item.value === 'ABNORMAL'
      ? { ...item, ...change } : item),
  };
}

export const draftChangedMessage = '다른 화면에서 저장 내용이 변경되었습니다. 현재 입력은 보관 중입니다. 서버 내용을 다시 불러와 확인한 뒤 작성해 주세요.';
export const draftUncertainMessage = '저장 결과를 확인하지 못했습니다. 서버에 저장되었을 수 있으므로 다시 저장할 수 없습니다. 서버 내용을 다시 불러와 확인해 주세요.';
