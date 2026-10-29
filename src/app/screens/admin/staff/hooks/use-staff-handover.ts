import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import {
  deactivateStaff,
  getReplacementStaff,
  getStaffDeactivationPreview,
} from '../../../../features/admin-staff/admin-staff-handover-api';
import type {
  StaffDeactivationPreview,
  StaffDeactivationResult,
} from '../../../../features/admin-staff/admin-staff-handover.types';
import type { AdminStaffDto } from '../../../../features/admin-staff/admin-staff.types';
import { useAdminNavigationGuard } from '../../hooks/use-admin-navigation-guard';

type Resource =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      preview: StaffDeactivationPreview;
      replacements: AdminStaffDto[];
    };

export function useStaffHandover(
  id: string,
  token: string,
  rejectSession: (token: string) => void,
) {
  const [resource, setResource] = useState<Resource>({ status: 'loading' });
  const [revision, setRevision] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [reviewing, setReviewing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<StaffDeactivationResult>();
  const pending = useRef<AbortController | null>(null);
  const locked = useRef(false);
  const edited = useRef(false);
  const completed = useRef(false);
  useAdminNavigationGuard(
    () =>
      !completed.current &&
      (edited.current || !!pending.current || locked.current),
  );

  const rejectAuth = useCallback(
    (error: unknown) => {
      if (
        error instanceof ApiRequestError &&
        (error.status === 401 || error.status === 403)
      ) {
        rejectSession(token);
        return true;
      }
      return false;
    },
    [token, rejectSession],
  );

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const preview = await getStaffDeactivationPreview(
          id,
          token,
          controller.signal,
        );
        const replacements =
          preview.staff.isActive &&
          preview.properties.some((property) => property.isActive)
            ? await getReplacementStaff(id, token, controller.signal)
            : [];
        if (controller.signal.aborted) return;
        completed.current = !preview.staff.isActive;
        locked.current = false;
        setBlocked(false);
        setResource({ status: 'ready', preview, replacements });
      } catch (error) {
        if (controller.signal.aborted || rejectAuth(error)) return;
        setResource({
          status: 'error',
          message:
            error instanceof ApiRequestError
              ? error.message
              : '인계 정보를 불러오지 못했습니다.',
        });
      }
    })();
    return () => controller.abort();
  }, [id, token, revision, rejectAuth]);

  useEffect(
    () => () => {
      pending.current?.abort();
    },
    [],
  );

  function reload() {
    if (pending.current) return;
    edited.current = false;
    completed.current = false;
    setResource({ status: 'loading' });
    setSelections({});
    setErrors({});
    setReviewing(false);
    setResult(undefined);
    setMessage('');
    setRevision((value) => value + 1);
  }

  function select(propertyId: string, replacementId: string) {
    if (busy || blocked || reviewing) return;
    edited.current = true;
    setSelections((current) => ({ ...current, [propertyId]: replacementId }));
    setErrors((current) => {
      const next = { ...current };
      delete next[propertyId];
      return next;
    });
    setMessage('');
  }

  function applyToAll(replacementId: string) {
    if (
      busy ||
      blocked ||
      reviewing ||
      !replacementId ||
      resource.status !== 'ready'
    )
      return;
    edited.current = true;
    setSelections(
      Object.fromEntries(
        resource.preview.properties
          .filter((property) => property.isActive)
          .map((property) => [property.id, replacementId]),
      ),
    );
    setErrors({});
    setMessage('');
  }

  function review() {
    if (
      resource.status !== 'ready' ||
      !resource.preview.staff.isActive ||
      pending.current ||
      locked.current
    )
      return;
    const nextErrors: Record<string, string> = {};
    for (const property of resource.preview.properties) {
      if (
        property.isActive &&
        !resource.replacements.some(
          (staff) => staff.id === selections[property.id],
        )
      )
        nextErrors[property.id] = '새 담당 직원을 선택해 주세요.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLElement>('.staff-handover [aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    edited.current = true;
    setMessage('');
    setReviewing(true);
  }

  async function save() {
    if (
      resource.status !== 'ready' ||
      !reviewing ||
      pending.current ||
      locked.current ||
      !resource.preview.staff.isActive
    )
      return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setMessage('');
    try {
      const saved = await deactivateStaff(
        id,
        {
          expectedStateToken: resource.preview.expectedStateToken,
          assignments: resource.preview.properties.map((property) => ({
            propertyId: property.id,
            replacementStaffId: property.isActive
              ? selections[property.id]
              : null,
          })),
        },
        token,
        controller.signal,
      );
      if (controller.signal.aborted) return;
      completed.current = true;
      locked.current = true;
      setResult(saved);
    } catch (error) {
      if (controller.signal.aborted || rejectAuth(error)) return;
      const uncertain =
        !(error instanceof ApiRequestError) ||
        error.status === null ||
        error.status >= 500 ||
        (error.status >= 200 && error.status < 300);
      const conflict =
        error instanceof ApiRequestError &&
        (error.status === 404 || error.status === 409);
      locked.current = uncertain || conflict;
      setBlocked(locked.current);
      setMessage(
        uncertain
          ? '처리 결과를 확인하지 못했습니다. 이미 인계되었을 수 있으니 최신 상태를 먼저 확인해 주세요.'
          : conflict
            ? '직원 또는 담당 정보가 바뀌었습니다. 최신 상태를 확인한 뒤 다시 선택해 주세요.'
            : error instanceof ApiRequestError
              ? error.message
              : '인계하지 못했습니다.',
      );
    } finally {
      if (pending.current === controller) pending.current = null;
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  return {
    resource,
    selections,
    reviewing,
    busy,
    message,
    blocked,
    errors,
    result,
    reload,
    select,
    applyToAll,
    review,
    save,
    edit: () => {
      if (!pending.current && !locked.current) setReviewing(false);
    },
  };
}
