import { useEffect, useRef, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { assignAdminPropertyStaff } from '../../../../features/admin-properties/admin-property-staff-api';
import type { AdminPropertyDto } from '../../../../features/admin-properties/admin-property-management.types';

type SaveState = { busy: boolean; blocked: boolean; message?: string };

export function usePropertyStaffSave(
  propertyId: string,
  token: string,
  rejectSession: (token: string) => void,
  onSaved: (property: AdminPropertyDto) => void,
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
  }, [propertyId, token]);

  async function save(staffUserId: string | null) {
    if (pending.current || locked.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setResult({ owner: token, state: { busy: true, blocked: false } });
    try {
      const saved = await assignAdminPropertyStaff(
        propertyId,
        staffUserId,
        token,
        controller.signal,
      );
      if (controller.signal.aborted) return;
      locked.current = true;
      onSaved(saved);
      setResult({ owner: token, state: { busy: false, blocked: true } });
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
      setResult({
        owner: token,
        state: {
          busy: false,
          blocked: locked.current,
          message: uncertain
            ? '배정 결과를 확인하지 못했습니다. 이미 저장되었을 수 있으니 최신 배정을 확인한 뒤 계속해 주세요.'
            : error instanceof ApiRequestError
              ? `${error.message}${conflict ? ' 최신 배정을 다시 확인해 주세요.' : ''}`
              : '배정을 저장하지 못했습니다.',
        },
      });
    } finally {
      if (pending.current === controller) pending.current = null;
    }
  }
  return {
    state:
      result?.owner === token ? result.state : { busy: false, blocked: false },
    save,
  };
}
