import { useEffect, useRef, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import type { AdminStayDto } from '../../../../features/admin-stays/admin-stays.types';
import type { StayFormValues } from '../model/stay-form-model';

type SaveState = {
  busy: boolean;
  message?: string;
  blocked?: 'stale' | 'uncertain';
  errors?: Partial<Record<keyof StayFormValues, string>>;
};

const fields = new Set<keyof StayFormValues>([
  'propertyId',
  'guestName',
  'company',
  'department',
  'phone',
  'checkInAt',
  'checkOutAt',
  'notes',
  'reason',
]);

export function useStaySave(
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
    operation: (signal: AbortSignal) => Promise<AdminStayDto>,
    onSaved: (stay: AdminStayDto) => void,
  ) {
    if (pending.current || blocked.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setResult({ owner: token, state: { busy: true } });
    try {
      const stay = await operation(controller.signal);
      if (!controller.signal.aborted) onSaved(stay);
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
      const stale =
        error instanceof ApiRequestError &&
        (error.code === 'STALE_STAY_REVISION' ||
          error.code === 'INVALID_STAY_STATE');
      // A lost/invalid successful response can follow a committed write. Never
      // automatically resend it, or imply that the write definitely failed.
      const uncertain =
        !(error instanceof ApiRequestError) ||
        error.status === null ||
        error.status >= 500 ||
        (error.status >= 200 && error.status < 300);
      blocked.current = stale || uncertain;
      const errors: Partial<Record<keyof StayFormValues, string>> = {};
      if (error instanceof ApiRequestError)
        for (const entry of error.errors)
          if (fields.has(entry.field as keyof StayFormValues))
            errors[entry.field as keyof StayFormValues] =
              entry.messages.join(' ');
      setResult({
        owner: token,
        state: {
          busy: false,
          blocked: stale ? 'stale' : uncertain ? 'uncertain' : undefined,
          message: stale
            ? '다른 변경 사항이 먼저 저장되었습니다. 최신 내용을 확인한 뒤 다시 진행해 주세요.'
            : uncertain
              ? '저장 결과를 확인하지 못했습니다. 이미 저장되었을 수 있으니, 일정을 확인한 뒤 다시 진행해 주세요.'
              : error instanceof ApiRequestError
                ? error.message
                : '저장하지 못했습니다.',
          errors,
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
