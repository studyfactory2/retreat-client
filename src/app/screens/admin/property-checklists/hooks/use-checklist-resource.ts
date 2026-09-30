import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { getAdminProperty } from '../../../../features/admin-properties/admin-property-management-api';
import type { AdminPropertyDto } from '../../../../features/admin-properties/admin-property-management.types';
import {
  getAdminChecklistTemplate,
  getPropertyChecklistTemplates,
} from '../../../../features/admin-checklist-templates/admin-checklist-template-api';
import type {
  ChecklistTemplateDto,
  ChecklistType,
} from '../../../../features/admin-checklist-templates/admin-checklist-template.types';

export type ChecklistWorkspaceData = {
  property: AdminPropertyDto;
  templates: ChecklistTemplateDto[];
  template?: ChecklistTemplateDto;
};
type Resource =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: ChecklistWorkspaceData };
export function useChecklistResource(
  propertyId: string,
  type: ChecklistType | undefined,
  token: string,
  rejectSession: (token: string) => void,
) {
  const scopeKey = `${propertyId}:${type ?? 'list'}:${token}`;
  const scope = useRef<string | null>(scopeKey);
  const request = useRef<AbortController | null>(null);
  const [state, setState] = useState<{ scope: string; resource: Resource }>();
  useLayoutEffect(() => {
    scope.current = scopeKey;
    return () => {
      scope.current = null;
      request.current?.abort();
    };
  }, [scopeKey]);
  const load = useCallback(async () => {
    if (scope.current !== scopeKey) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const current = () =>
      !controller.signal.aborted &&
      scope.current === scopeKey &&
      request.current === controller;
    try {
      const results = await Promise.allSettled([
        getAdminProperty(propertyId, token, controller.signal),
        getPropertyChecklistTemplates(propertyId, token, controller.signal),
      ]);
      if (!current()) return;
      const denied = results.find(
        (result) =>
          result.status === 'rejected' &&
          result.reason instanceof ApiRequestError &&
          [401, 403].includes(result.reason.status ?? 0),
      );
      if (denied) {
        rejectSession(token);
        return;
      }
      const [propertyResult, templatesResult] = results;
      if (propertyResult.status === 'rejected') throw propertyResult.reason;
      if (templatesResult.status === 'rejected') throw templatesResult.reason;
      const selected = templatesResult.value.find(
        (template) => template.type === type,
      );
      const template = selected
        ? await getAdminChecklistTemplate(selected.id, token, controller.signal)
        : undefined;
      if (!current()) return;
      if (
        template &&
        (template.propertyId !== propertyId.toLowerCase() ||
          template.type !== type)
      )
        throw new Error('Unexpected checklist scope');
      setState({
        scope: scopeKey,
        resource: {
          status: 'ready',
          data: {
            property: propertyResult.value,
            templates: templatesResult.value,
            template,
          },
        },
      });
    } catch (error) {
      if (!current()) return;
      if (
        error instanceof ApiRequestError &&
        [401, 403].includes(error.status ?? 0)
      ) {
        rejectSession(token);
        return;
      }
      setState({
        scope: scopeKey,
        resource: {
          status: 'error',
          message:
            '휴양소와 체크리스트 정보를 확인하지 못했습니다. 다시 불러와 주세요.',
        },
      });
    } finally {
      if (request.current === controller) request.current = null;
    }
  }, [propertyId, type, token, scopeKey, rejectSession]);
  const refresh = useCallback(() => {
    if (scope.current !== scopeKey) return;
    setState({ scope: scopeKey, resource: { status: 'loading' } });
    void load();
  }, [load, scopeKey]);
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- load publishes only after awaited API responses.
    void load();
    return () => request.current?.abort();
  }, [load]);
  function accept(template: ChecklistTemplateDto) {
    if (
      scope.current !== scopeKey ||
      template.propertyId !== propertyId.toLowerCase() ||
      template.type !== type
    )
      return;
    setState((previous) =>
      previous?.scope === scopeKey && previous.resource.status === 'ready'
        ? {
            scope: scopeKey,
            resource: {
              status: 'ready',
              data: {
                ...previous.resource.data,
                property: {
                  ...previous.resource.data.property,
                  ...template.property,
                },
                template,
                templates: [
                  ...previous.resource.data.templates.filter(
                    (item) => item.type !== template.type,
                  ),
                  template,
                ],
              },
            },
          }
        : previous,
    );
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
