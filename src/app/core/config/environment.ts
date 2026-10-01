function resolveOrigin(
  value: string | undefined,
  development: boolean,
  name: 'VITE_API_BASE_URL' | 'VITE_FRONTEND_URL',
  developmentDefault: string,
): string {
  const configured = value?.trim() || (development ? developmentDefault : '');
  if (!configured) throw new Error(`${name} must be configured.`);

  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new Error(`${name} must be an HTTP(S) origin.`);
  }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    url.hostname.includes('*') ||
    (!development &&
      (name === 'VITE_FRONTEND_URL' || !local) &&
      url.protocol !== 'https:')
  ) {
    throw new Error(
      `${name} must be an origin without a path, credentials, query, fragment, or wildcard; production requires HTTPS.`,
    );
  }
  return url.origin;
}

export function resolveApiBaseUrl(
  value: string | undefined,
  development: boolean,
): string {
  return resolveOrigin(
    value,
    development,
    'VITE_API_BASE_URL',
    'http://localhost:3100',
  );
}

export function resolveFrontendOrigin(
  value: string | undefined,
  development: boolean,
): string {
  return resolveOrigin(
    value,
    development,
    'VITE_FRONTEND_URL',
    'http://localhost:5175',
  );
}

export const appConfig = {
  apiBaseUrl: resolveApiBaseUrl(
    import.meta.env.VITE_API_BASE_URL,
    import.meta.env.DEV,
  ),
  // Match the backend's FRONTEND_URL, which can differ from the admin tab origin.
  frontendOrigin: resolveFrontendOrigin(
    import.meta.env.VITE_FRONTEND_URL,
    import.meta.env.DEV,
  ),
} as const;
