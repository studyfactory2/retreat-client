export type ApiFieldError = { field: string; messages: string[] }

export class ApiRequestError extends Error {
  readonly status: number | null
  readonly code: string
  readonly errors: ApiFieldError[]

  constructor(
    message: string,
    status: number | null,
    code: string,
    errors: ApiFieldError[] = [],
  ) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
    this.errors = errors
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isFieldError(value: unknown): value is ApiFieldError {
  return (
    isRecord(value) &&
    typeof value.field === 'string' &&
    Array.isArray(value.messages) &&
    value.messages.every((message) => typeof message === 'string')
  )
}

export async function readApiError(
  response: Response,
): Promise<ApiRequestError> {
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    /* Proxies may send non-JSON errors. */
  }

  const fallback: Record<number, string> = {
    400: '입력값을 확인해 주세요.',
    401: '접근 정보를 확인해 주세요.',
    403: '접근 권한이 없습니다.',
    404: '요청한 내용을 찾을 수 없습니다.',
    409: '내용이 변경되었습니다. 최신 내용을 확인해 주세요.',
    413: '파일 또는 요청 크기가 너무 큽니다.',
    429: '요청이 많습니다. 잠시 후 다시 시도해 주세요.',
  }
  const declared =
    isRecord(payload) &&
    typeof payload.code === 'string' &&
    typeof payload.message === 'string'
      ? {
          code: payload.code,
          message: payload.message,
          errors: Array.isArray(payload.errors)
            ? payload.errors.filter(isFieldError)
            : [],
        }
      : null
  const message =
    declared && response.status < 500
      ? declared.message
      : (fallback[response.status] ??
        '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.')

  return new ApiRequestError(
    message,
    response.status,
    declared?.code ?? 'HTTP_ERROR',
    declared?.errors ?? [],
  )
}
