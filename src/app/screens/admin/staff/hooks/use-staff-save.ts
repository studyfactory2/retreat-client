import { useEffect, useRef, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import type { AdminStaffDto } from '../../../../features/admin-staff/admin-staff.types';
import type { StaffFormErrors } from '../model/staff-form-model';

type SaveState = {
  busy: boolean;
  blocked?: boolean;
  uncertain?: boolean;
  message?: string;
  errors?: StaffFormErrors;
};
export function useStaffSave(
  token: string,
  rejectSession: (token: string) => void,
) {
  const pending = useRef<AbortController | null>(null);
  const locked = useRef(false);
  const [result, setResult] = useState<{ owner: string; state: SaveState }>();
  useEffect(() => {
    locked.current = false;
    return () => {
      pending.current?.abort();
      pending.current = null;
    };
  }, [token]);
  async function save(
    operation: (signal: AbortSignal) => Promise<AdminStaffDto>,
    onSaved: (staff: AdminStaffDto) => void,
  ) {
    if (pending.current || locked.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setResult({ owner: token, state: { busy: true } });
    try {
      const staff = await operation(controller.signal);
      if (!controller.signal.aborted) {
        locked.current = true;
        onSaved(staff);
      }
    } catch (error: unknown) {
      if (controller.signal.aborted) return;
      if (
        error instanceof ApiRequestError &&
        (error.status === 401 || error.status === 403)
      ) {
        locked.current = true;
        rejectSession(token);
        return;
      }
      const uncertain =
        !(error instanceof ApiRequestError) ||
        error.status === null ||
        error.status >= 500 ||
        (error.status >= 200 && error.status < 300);
      const conflict =
        error instanceof ApiRequestError &&
        (error.status === 404 || error.status === 409);
      locked.current = uncertain || conflict;
      const errors: StaffFormErrors = {};
      if (error instanceof ApiRequestError) {
        for (const field of [
          'name',
          'phone',
          'company',
          'department',
          'isActive',
        ] as const) {
          const entry = error.errors.find((item) => item.field === field);
          if (entry) errors[field] = entry.messages.join(' ');
        }
      }
      setResult({
        owner: token,
        state: {
          busy: false,
          blocked: locked.current,
          uncertain,
          errors,
          message: uncertain
            ? '저장 결과를 확인하지 못했습니다. 이미 저장되었을 수 있으니 최신 직원 정보를 확인한 뒤 진행해 주세요.'
            : error instanceof ApiRequestError
              ? error.message
              : '직원 정보를 저장하지 못했습니다.',
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
