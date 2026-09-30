import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { getAdminPropertyGuide } from '../../../../features/admin-property-guides/admin-property-guide-api';
import type { AdminPropertyGuideDto } from '../../../../features/admin-property-guides/admin-property-guide.types';

type Resource =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: AdminPropertyGuideDto };

export function usePropertyGuide(
  propertyId: string,
  token: string,
  rejectSession: (token: string) => void,
) {
  const scopeKey = `${propertyId}:${token}`;
  const owner = useRef<string | null>(scopeKey);
  const request = useRef<AbortController | null>(null);
  const [state, setState] = useState<{ scope: string; resource: Resource }>();
  useLayoutEffect(() => {
    owner.current = scopeKey;
    return () => {
      owner.current = null;
      request.current?.abort();
      request.current = null;
    };
  }, [scopeKey]);
  const load = useCallback(async () => {
    if (owner.current !== scopeKey) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const current = () =>
      owner.current === scopeKey &&
      request.current === controller &&
      !controller.signal.aborted;
    try {
      const data = await getAdminPropertyGuide(
        propertyId,
        token,
        controller.signal,
      );
      if (current())
        setState({ scope: scopeKey, resource: { status: 'ready', data } });
    } catch (error) {
      if (!current()) return;
      if (
        error instanceof ApiRequestError &&
        [401, 403].includes(error.status ?? 0)
      ) {
        rejectSession(token);
        return;
      }
      setState({ scope: scopeKey, resource: { status: 'error' } });
    } finally {
      if (request.current === controller) request.current = null;
    }
  }, [propertyId, token, scopeKey, rejectSession]);
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- load publishes only after awaited API responses.
    void load();
    return () => request.current?.abort();
  }, [load]);
  function refresh() {
    if (owner.current !== scopeKey) return;
    setState({ scope: scopeKey, resource: { status: 'loading' } });
    void load();
  }
  function accept(data: AdminPropertyGuideDto) {
    if (
      owner.current !== scopeKey ||
      data.property.id !== propertyId.toLowerCase()
    )
      return;
    setState({ scope: scopeKey, resource: { status: 'ready', data } });
  }
  return {
    resource:
      state?.scope === scopeKey
        ? state.resource
        : ({ status: 'loading' } as Resource),
    refresh,
    accept,
  };
}
