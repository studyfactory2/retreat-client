export function resolveApiBaseUrl(
  value: string | undefined,
  development: boolean,
): string {
  const configured =
    value?.trim() || (development ? 'http://localhost:3100' : '')
  if (!configured) throw new Error('VITE_API_BASE_URL must be configured.')

  let url: URL
  try {
    url = new URL(configured)
  } catch {
    throw new Error('VITE_API_BASE_URL must be an HTTP(S) origin.')
  }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    (!development && !local && url.protocol !== 'https:')
  ) {
    throw new Error(
      'VITE_API_BASE_URL must be an origin without a path or credentials; production requires HTTPS.',
    )
  }
  return url.origin
}

export const appConfig = {
  apiBaseUrl: resolveApiBaseUrl(
    import.meta.env.VITE_API_BASE_URL,
    import.meta.env.DEV,
  ),
} as const
