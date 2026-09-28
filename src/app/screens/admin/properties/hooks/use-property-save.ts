import { useEffect, useRef, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import type { AdminPropertyDto } from '../../../../features/admin-properties/admin-property-management.types';
import type { PropertyFormErrors } from '../model/property-form-model';

type SaveState = {
  busy: boolean;
  uncertain?: boolean;
  message?: string;
  errors?: PropertyFormErrors;
};

export function usePropertySave(
  token: string,
  rejectSession: (token: string) => void,
) {
  const pending = useRef<AbortController | null>(null);
  const blocked = useRef(false);
  const [result, setResult] = useState<{ owner: string; state: SaveState }>();
  useEffect(() => {
    blocked.current = false;
    return () => {
      pending.current?.abort();
      pending.current = null;
    };
  }, [token]);

  async function save(
    operation: (signal: AbortSignal) => Promise<AdminPropertyDto>,
    onSaved: (property: AdminPropertyDto) => void,
  ) {
    if (pending.current || blocked.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setResult({ owner: token, state: { busy: true } });
    try {
      const property = await operation(controller.signal);
      if (!controller.signal.aborted) onSaved(property);
    } catch (error: unknown) {
      if (controller.signal.aborted) return;
      if (
        error instanceof ApiRequestError &&
        (error.status === 401 || error.status === 403)
      ) {
        blocked.current = true;
        rejectSession(token);
        return;
      }
      const uncertain =
        !(error instanceof ApiRequestError) ||
        error.status === null ||
        error.status >= 500 ||
        (error.status >= 200 && error.status < 300);
      blocked.current = uncertain;
      const errors: PropertyFormErrors = {};
      if (error instanceof ApiRequestError) {
        for (const field of [
          'name',
          'region',
          'isActive',
          'vehicleRegistrationEnabled',
        ] as const) {
          const entry = error.errors.find((item) => item.field === field);
          if (entry) errors[field] = entry.messages.join(' ');
        }
        if (error.code === 'PROPERTY_NAME_EXISTS')
          errors.name = '같은 이름의 휴양소가 이미 등록되어 있습니다.';
      }
      setResult({
        owner: token,
        state: {
          busy: false,
          uncertain,
          errors,
          message: uncertain
            ? '저장 결과를 확인하지 못했습니다. 이미 저장되었을 수 있으니 휴양소 목록에서 확인해 주세요.'
            : error instanceof ApiRequestError
              ? error.message
              : '휴양소 정보를 저장하지 못했습니다.',
        },
      });
    } finally {
      if (pending.current === controller) pending.current = null;
    }
  }
  return {
    state:
      result?.owner === token ? result.state : ({ busy: false } as SaveState),
    save,
  };
}
