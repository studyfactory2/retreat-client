import { getSeoulToday } from '../../../../core/dates/seoul-date';
import type { GuestDraftType } from '../../../../features/guest-drafts/guest-drafts.types';
import type { GuestEntryContext } from '../../../../features/guest-entry/guest-entry.types';
import type { GuestView } from './guest-entry-model';

export type GuestStartFields = {
  guestName: string;
  visitDate: string;
  company: string;
  department: string;
  phone: string;
};
export type GuestStartErrors = Partial<Record<keyof GuestStartFields, string>>;

export function createGuestStartFields(): GuestStartFields {
  return {
    guestName: '',
    visitDate: getSeoulToday(),
    company: '',
    department: '',
    phone: '',
  };
}

export function getGuestStartType(view: GuestView): GuestDraftType | null {
  return view === 'check-in'
    ? 'CHECK_IN'
    : view === 'check-out'
      ? 'CHECK_OUT'
      : null;
}

export function guestStartTitle(type: GuestDraftType): string {
  return type === 'CHECK_IN' ? '입실 체크' : '퇴실 체크';
}

export function validateGuestStartFields(
  fields: GuestStartFields,
): GuestStartErrors {
  const errors: GuestStartErrors = {};
  if (!fields.guestName.trim()) errors.guestName = '이름을 입력해 주세요.';
  else if ([...fields.guestName.trim()].length > 100)
    errors.guestName = '이름은 100자까지 입력할 수 있습니다.';
  const date = new Date(`${fields.visitDate}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(fields.visitDate) ||
    fields.visitDate < '1900-01-01' ||
    fields.visitDate > '2100-12-31' ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== fields.visitDate
  ) {
    errors.visitDate = '1900년부터 2100년 사이의 올바른 날짜를 선택해 주세요.';
  }
  for (const field of ['company', 'department', 'phone'] as const) {
    const max = field === 'phone' ? 50 : 150;
    if ([...fields[field].trim()].length > max)
      errors[field] = `${max}자까지 입력할 수 있습니다.`;
  }
  return errors;
}

export function sameGuestStartContext(
  first: GuestEntryContext,
  second: GuestEntryContext,
  type: GuestDraftType,
): boolean {
  if (
    first.kind !== second.kind ||
    first.context.property.id !== second.context.property.id
  )
    return false;
  const before = first.context.checklists.find(
    (checklist) => checklist.type === type,
  );
  const after = second.context.checklists.find(
    (checklist) => checklist.type === type,
  );
  if (
    !before ||
    !after ||
    before.id !== after.id ||
    before.version !== after.version
  )
    return false;
  if (first.kind === 'stay' && second.kind === 'stay') {
    return (
      first.context.stayId === second.context.stayId &&
      first.context.guestName === second.context.guestName &&
      first.context.checkInAt === second.context.checkInAt &&
      first.context.checkOutAt === second.context.checkOutAt
    );
  }
  return true;
}
