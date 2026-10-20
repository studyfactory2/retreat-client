import { apiRequest } from '../../core/api/api-client';
import { ApiRequestError } from '../../core/api/api-error';
import type {
  AdminAccount,
  PasswordValues,
  ProfileValues,
} from './admin-account.types';

function invalidResponse() {
  return new ApiRequestError(
    '계정 정보를 확인하지 못했습니다. 다시 불러와 주세요.',
    null,
    'INVALID_RESPONSE',
  );
}

function readAccount(value: unknown, expectedId: string): AdminAccount {
  if (!value || typeof value !== 'object') throw invalidResponse();
  const account = value as Record<string, unknown>;
  if (
    account.id !== expectedId ||
    account.role !== 'ADMIN' ||
    typeof account.name !== 'string' ||
    !account.name.trim() ||
    typeof account.loginId !== 'string' ||
    !account.loginId.trim() ||
    typeof account.updatedAt !== 'string' ||
    !Number.isFinite(Date.parse(account.updatedAt)) ||
    !['phone', 'company', 'department'].every(
      (key) => account[key] === null || typeof account[key] === 'string',
    )
  )
    throw invalidResponse();
  return {
    id: expectedId,
    role: 'ADMIN',
    name: account.name,
    loginId: account.loginId,
    phone: account.phone as string | null,
    company: account.company as string | null,
    department: account.department as string | null,
    updatedAt: account.updatedAt,
  };
}

export async function getAdminAccount(
  token: string,
  userId: string,
  signal?: AbortSignal,
) {
  return readAccount(
    await apiRequest<unknown>('/admin/account', { token, signal }),
    userId,
  );
}

export async function saveAdminProfile(
  token: string,
  original: AdminAccount,
  values: ProfileValues,
  signal: AbortSignal,
) {
  const value = await apiRequest<unknown>('/admin/account/profile', {
    method: 'POST',
    token,
    signal,
    body: {
      name: values.name.trim(),
      phone: values.phone.trim() || null,
      company: values.company.trim() || null,
      department: values.department.trim() || null,
      expectedUpdatedAt: original.updatedAt,
    },
  });
  return readAccount(value, original.id);
}

export async function changeAdminPassword(
  token: string,
  values: PasswordValues,
  signal: AbortSignal,
) {
  const result = await apiRequest<unknown>('/admin/account/password', {
    method: 'POST',
    token,
    signal,
    body: { ...values },
  });
  if (
    !result ||
    typeof result !== 'object' ||
    !('passwordChanged' in result) ||
    result.passwordChanged !== true
  )
    throw invalidResponse();
}
