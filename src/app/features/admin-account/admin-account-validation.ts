import { ApiRequestError } from '../../core/api/api-error';
import type {
  AccountFieldErrors,
  AdminAccount,
  PasswordValues,
  ProfileValues,
} from './admin-account.types';

export function profileValues(account: AdminAccount): ProfileValues {
  return {
    name: account.name,
    phone: account.phone ?? '',
    company: account.company ?? '',
    department: account.department ?? '',
  };
}
export function validateProfile(
  values: ProfileValues,
): AccountFieldErrors<ProfileValues> {
  const errors: AccountFieldErrors<ProfileValues> = {};
  if (!values.name.trim()) errors.name = '이름을 입력해 주세요.';
  for (const [field, limit] of [
    ['name', 100],
    ['phone', 32],
    ['company', 100],
    ['department', 100],
  ] as const)
    if ([...values[field].trim()].length > limit)
      errors[field] = `${limit}자 이하로 입력해 주세요.`;
  return errors;
}
export function validatePassword(
  values: PasswordValues,
): AccountFieldErrors<PasswordValues> {
  const errors: AccountFieldErrors<PasswordValues> = {};
  if (!values.currentPassword)
    errors.currentPassword = '현재 비밀번호를 입력해 주세요.';
  else if (new TextEncoder().encode(values.currentPassword).length > 72)
    errors.currentPassword = '현재 비밀번호를 확인해 주세요.';
  if ([...values.newPassword].length < 8)
    errors.newPassword = '새 비밀번호는 8자 이상으로 입력해 주세요.';
  else if (new TextEncoder().encode(values.newPassword).length > 72)
    errors.newPassword = '새 비밀번호는 UTF-8 기준 72바이트 이하여야 합니다.';
  else if (values.newPassword === values.currentPassword)
    errors.newPassword = '현재 비밀번호와 다르게 입력해 주세요.';
  if (!values.confirmPassword)
    errors.confirmPassword = '새 비밀번호를 다시 입력해 주세요.';
  else if (values.newPassword !== values.confirmPassword)
    errors.confirmPassword = '새 비밀번호가 서로 일치하지 않습니다.';
  return errors;
}
export function uncertainAccountWrite(error: unknown): boolean {
  return (
    !(error instanceof ApiRequestError) ||
    error.status === null ||
    error.status >= 500 ||
    error.code === 'INVALID_RESPONSE'
  );
}
export function accountErrorMessage(error: unknown) {
  return error instanceof ApiRequestError
    ? error.message
    : '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';
}
export function accountFieldErrors<T extends ProfileValues | PasswordValues>(
  error: unknown,
  fields: (keyof T)[],
): AccountFieldErrors<T> {
  const errors: AccountFieldErrors<T> = {};
  if (error instanceof ApiRequestError)
    for (const field of fields) {
      const item = error.errors.find((item) => item.field === field);
      if (item?.messages[0]) errors[field] = item.messages[0];
    }
  return errors;
}
