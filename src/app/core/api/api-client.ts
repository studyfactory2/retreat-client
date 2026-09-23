import { appConfig } from '../config/environment'
import { ApiRequestError, readApiError } from './api-error'

type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }
type RequestOptions = {
  token?: string
  signal?: AbortSignal
} & (
  | { method?: 'GET'; body?: never }
  | { method: 'POST'; body?: JsonValue | FormData }
)

async function request<T>(
  path: string,
  options: RequestOptions,
  read: (response: Response) => Promise<T>,
): Promise<T> {
  // Never attach a scoped credential to an arbitrary URL, including signed S3 URLs.
  if (
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('\\') ||
    path.includes('#')
  ) {
    throw new ApiRequestError(
      '요청 주소를 확인해 주세요.',
      null,
      'INVALID_API_PATH',
    )
  }
  const url = new URL(path, appConfig.apiBaseUrl)
  if (url.origin !== appConfig.apiBaseUrl) {
    throw new ApiRequestError(
      '요청 주소를 확인해 주세요.',
      null,
      'INVALID_API_PATH',
    )
  }

  const headers = new Headers({ Accept: 'application/json' })
  if (options.token !== undefined)
    headers.set('Authorization', `Bearer ${options.token}`)
  const multipart = options.body instanceof FormData
  if (options.body !== undefined && !multipart)
    headers.set('Content-Type', 'application/json')

  const controller = new AbortController()
  const abort = () => controller.abort()
  options.signal?.addEventListener('abort', abort, { once: true })
  if (options.signal?.aborted) abort()
  let timedOut = false
  const timeout = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, 30_000)
  try {
    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body:
        options.body === undefined
          ? undefined
          : multipart
            ? (options.body as FormData)
            : JSON.stringify(options.body),
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      redirect: 'error',
      signal: controller.signal,
    })
    if (!response.ok) throw await readApiError(response)
    return await read(response)
  } catch (error) {
    if (options.signal?.aborted)
      throw new DOMException('Request cancelled', 'AbortError')
    if (timedOut)
      throw new ApiRequestError(
        '응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.',
        null,
        'REQUEST_TIMEOUT',
      )
    if (error instanceof ApiRequestError) throw error
    throw new ApiRequestError(
      '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.',
      null,
      'NETWORK_ERROR',
    )
  } finally {
    clearTimeout(timeout)
    options.signal?.removeEventListener('abort', abort)
  }
}

// The caller validates important response fields. The generic is a TypeScript contract.
export function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  return request(path, options, async (response) => {
    if (response.status === 204) return undefined as T
    try {
      return (await response.json()) as T
    } catch {
      throw new ApiRequestError(
        '서버 응답을 확인할 수 없습니다.',
        response.status,
        'INVALID_RESPONSE',
      )
    }
  })
}

export function apiDownload(
  path: string,
  options: RequestOptions = {},
): Promise<Blob> {
  return request(path, options, (response) => response.blob())
}
