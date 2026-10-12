import { appConfig } from '../config/environment';
import { ApiRequestError, readApiError } from './api-error';

type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type RequestOptions = {
  token?: string;
  photoToken?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
} & (
  | { method?: 'GET'; body?: never }
  | { method: 'POST'; body?: JsonValue | FormData }
);

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
    path.includes('#') ||
    Array.from(path).some((character) => {
      const code = character.charCodeAt(0);
      return code <= 32 || code === 127;
    }) ||
    /%(?:2f|5c)/i.test(path.split('?')[0] ?? '')
  ) {
    throw new ApiRequestError(
      '요청 주소를 확인해 주세요.',
      null,
      'INVALID_API_PATH',
    );
  }
  const baseUrl = new URL(appConfig.apiBaseUrl);
  const prefix = baseUrl.pathname === '/' ? '' : baseUrl.pathname;
  // Concatenation preserves the deployment prefix; URL resolution with a leading
  // slash would discard it. Reject dot segments that resolve outside that prefix.
  const url = new URL(appConfig.apiBaseUrl + path);
  if (url.origin !== baseUrl.origin || !url.pathname.startsWith(`${prefix}/`)) {
    throw new ApiRequestError(
      '요청 주소를 확인해 주세요.',
      null,
      'INVALID_API_PATH',
    );
  }

  if (
    options.photoToken !== undefined &&
    (!options.token ||
      !/^\/guest\/issues\/photos\/[0-9a-f-]{36}\/(view|remove)$/.test(path) ||
      !/^[A-Za-z0-9_-]{43}$/.test(options.photoToken))
  ) {
    throw new ApiRequestError(
      '사진 요청의 접근 정보를 확인해 주세요.',
      null,
      'INVALID_PHOTO_REQUEST',
    );
  }

  const headers = new Headers({ Accept: 'application/json' });
  if (options.token !== undefined)
    headers.set('Authorization', `Bearer ${options.token}`);
  if (options.photoToken !== undefined)
    headers.set('X-Photo-Token', options.photoToken);
  const multipart = options.body instanceof FormData;
  if (options.body !== undefined && !multipart)
    headers.set('Content-Type', 'application/json');

  const controller = new AbortController();
  const abort = () => controller.abort();
  options.signal?.addEventListener('abort', abort, { once: true });
  if (options.signal?.aborted) abort();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, options.timeoutMs ?? 30_000);
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
    });
    if (!response.ok) throw await readApiError(response);
    return await read(response);
  } catch (error) {
    if (options.signal?.aborted)
      throw new DOMException('Request cancelled', 'AbortError');
    if (timedOut)
      throw new ApiRequestError(
        '응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.',
        null,
        'REQUEST_TIMEOUT',
      );
    if (error instanceof ApiRequestError) throw error;
    throw new ApiRequestError(
      '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.',
      null,
      'NETWORK_ERROR',
    );
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', abort);
  }
}

export function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  return request(path, options, async (response) => {
    if (response.status === 204) return undefined as T;
    try {
      return (await response.json()) as T;
    } catch {
      throw new ApiRequestError(
        '서버 응답을 확인할 수 없습니다.',
        response.status,
        'INVALID_RESPONSE',
      );
    }
  });
}

export function apiDownload(
  path: string,
  options: RequestOptions = {},
): Promise<Blob> {
  return request(path, options, (response) => response.blob());
}
