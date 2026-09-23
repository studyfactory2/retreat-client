import { apiRequest } from '../../core/api/api-client'
import { ApiRequestError } from '../../core/api/api-error'
import type {
  AdminLoginInput,
  AdminLoginResponse,
  AdminUser,
} from './admin-auth.types'

const MAX_TOKEN_LENGTH = 8_000
const MAX_TOKEN_LIFETIME_SECONDS = 30 * 24 * 60 * 60

function invalidAuthResponse(status = 200): ApiRequestError {
  return new ApiRequestError(
    status === 403
      ? '관리자 계정으로 로그인해 주세요.'
      : '로그인 정보를 확인할 수 없습니다. 다시 시도해 주세요.',
    status,
    'INVALID_AUTH_RESPONSE',
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonemptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function readAdminUser(value: unknown): AdminUser {
  if (!isRecord(value)) throw invalidAuthResponse()
  if (value.role !== 'ADMIN') throw invalidAuthResponse(403)
  if (
    !isNonemptyString(value.id) ||
    !isNonemptyString(value.name) ||
    !isNonemptyString(value.loginId)
  ) {
    throw invalidAuthResponse()
  }
  return {
    id: value.id,
    name: value.name,
    loginId: value.loginId,
    role: 'ADMIN',
  }
}

async function readAuthResponse(request: Promise<unknown>): Promise<unknown> {
  try {
    return await request
  } catch (error) {
    if (error instanceof ApiRequestError && error.code === 'INVALID_RESPONSE') {
      throw invalidAuthResponse()
    }
    throw error
  }
}

export async function loginAdmin(
  input: AdminLoginInput,
  signal?: AbortSignal,
): Promise<AdminLoginResponse> {
  const value = await readAuthResponse(
    apiRequest<unknown>('/users/login', {
      method: 'POST',
      body: {
        loginId: input.loginId.trim(),
        password: input.password,
        ...(input.autoLogin === undefined
          ? {}
          : { autoLogin: input.autoLogin }),
      },
      signal,
    }),
  )
  if (!isRecord(value)) throw invalidAuthResponse()
  const user = readAdminUser(value.user)
  if (
    typeof value.token !== 'string' ||
    value.token.length === 0 ||
    value.token.length > MAX_TOKEN_LENGTH ||
    /\s/.test(value.token) ||
    value.tokenType !== 'Bearer' ||
    typeof value.expiresIn !== 'number' ||
    !Number.isFinite(value.expiresIn) ||
    !Number.isInteger(value.expiresIn) ||
    value.expiresIn <= 0 ||
    value.expiresIn > MAX_TOKEN_LIFETIME_SECONDS
  ) {
    throw invalidAuthResponse()
  }
  return {
    user,
    token: value.token,
    tokenType: 'Bearer',
    expiresIn: value.expiresIn,
  }
}

export async function getCurrentAdmin(
  token: string,
  signal?: AbortSignal,
): Promise<AdminUser> {
  const value = await readAuthResponse(
    apiRequest<unknown>('/users/me', { token, signal }),
  )
  return readAdminUser(value)
}
