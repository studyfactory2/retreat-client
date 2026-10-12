import { resolveApiBaseUrl, resolveFrontendOrigin } from './origins';

export { resolveApiBaseUrl, resolveFrontendOrigin } from './origins';

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
