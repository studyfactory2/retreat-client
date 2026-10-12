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
  const apiPrefix =
    name === 'VITE_API_BASE_URL' && url.pathname === '/api' ? '/api' : '';
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    (url.pathname !== '/' && !apiPrefix) ||
    url.search ||
    url.hash ||
    url.hostname.includes('*') ||
    (!development &&
      (name === 'VITE_FRONTEND_URL' || !local) &&
      url.protocol !== 'https:')
  ) {
    throw new Error(
      `${name} must be an origin${name === 'VITE_API_BASE_URL' ? ' optionally ending in /api' : ' without a path'}, without credentials, query, fragment, or wildcard; production requires HTTPS.`,
    );
  }
  return url.origin + apiPrefix;
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
