import { isAccessCode } from '../../../../features/admin-property-access/admin-property-access-api';
import type {
  AccessCodeField,
  AdminPropertyAccessDto,
  RoomCodeMode,
  SavePropertyAccessInput,
} from '../../../../features/admin-property-access/admin-property-access.types';

export type CodeEdit = { action: 'keep' | 'replace' | 'clear'; value: string };
export type AccessFormValues = {
  roomMode: RoomCodeMode | null;
  codes: Record<AccessCodeField, CodeEdit>;
};
export type AccessFormErrors = Partial<
  Record<AccessCodeField | 'roomMode', string>
>;
export const codeLabels: Record<AccessCodeField, string> = {
  entranceCode: '공동현관 비밀번호',
  fixedRoomCode: '객실 비밀번호',
  vacancyCode: '공실 비밀번호',
};
export function activeCodeFields(values: AccessFormValues): AccessCodeField[] {
  return values.roomMode === null
    ? ['entranceCode']
    : [
        'entranceCode',
        values.roomMode === 'FIXED' ? 'fixedRoomCode' : 'vacancyCode',
      ];
}

export function initialAccessValues(
  data: AdminPropertyAccessDto,
): AccessFormValues {
  return {
    roomMode: data.settings.roomMode,
    codes: {
      entranceCode: { action: 'keep', value: '' },
      fixedRoomCode: { action: 'keep', value: '' },
      vacancyCode: { action: 'keep', value: '' },
    },
  };
}

export function accessFormDirty(
  data: AdminPropertyAccessDto,
  values: AccessFormValues,
): boolean {
  return (
    data.settings.roomMode !== values.roomMode ||
    activeCodeFields(values).some(
      (field) => values.codes[field].action !== 'keep',
    )
  );
}

export function validateAccessForm(
  data: AdminPropertyAccessDto,
  values: AccessFormValues,
): AccessFormErrors {
  const errors: AccessFormErrors = {};
  if (!values.roomMode) errors.roomMode = '객실 비밀번호 방식을 선택해 주세요.';
  for (const field of activeCodeFields(values)) {
    if (
      values.codes[field].action === 'replace' &&
      !isAccessCode(values.codes[field].value)
    )
      errors[field] = '숫자, * 또는 #으로 1~32자 입력해 주세요.';
  }
  const fixed = values.codes.fixedRoomCode;
  if (
    values.roomMode === 'FIXED' &&
    (fixed.action === 'clear' ||
      (fixed.action === 'keep' && !data.settings.hasFixedRoomCode))
  )
    errors.fixedRoomCode = '고정으로 사용할 객실 비밀번호를 입력해 주세요.';
  return errors;
}

export function buildAccessInput(
  data: AdminPropertyAccessDto,
  values: AccessFormValues,
): SavePropertyAccessInput | null {
  if (
    !values.roomMode ||
    !accessFormDirty(data, values) ||
    Object.keys(validateAccessForm(data, values)).length
  )
    return null;
  const input: SavePropertyAccessInput = {
    expectedVersion: data.settings.version,
    roomMode: values.roomMode,
  };
  for (const field of activeCodeFields(values)) {
    const edit = values.codes[field];
    if (edit.action === 'replace') input[field] = edit.value;
    if (edit.action === 'clear') input[field] = null;
  }
  return input;
}
