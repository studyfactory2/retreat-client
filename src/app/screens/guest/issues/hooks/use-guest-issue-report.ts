import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { getGuestEntryContext } from '../../../../features/guest-entry/guest-entry-api';
import {
  getGuestIssueCategories,
  reportGuestIssue,
} from '../../../../features/guest-issues/guest-issues-api';
import type { GuestIssueReportFields } from '../../../../features/guest-issues/guest-issues.types';
import { prepareGuestIssueReport } from '../../../../features/guest-issues/guest-issues-validation';
import {
  dirtyGuestIssueReport,
  emptyGuestIssueForm,
  guestIssueCategoryChangedMessage,
  guestIssueUncertainMessage,
  readyGuestIssueReport,
  rejectedGuestQr,
  sameGuestIssuePhotos,
  unavailableGuestIssueReport,
  unknownGuestIssueOutcome,
  usableGuestIssuePhotos,
  type GuestIssueReportAttempt,
  type GuestIssueReportPhotoSnapshot,
  type GuestIssueReportResource,
  type ReadyGuestIssueReport,
} from '../model/guest-issue-report-model';
import { useGuestIssueReportLifetime } from './use-guest-issue-report-lifetime';

export function useGuestIssueReport(token: string | null) {
  // The QR credential owns only this in-memory session, never a persisted key.
  const owner = useMemo(() => ({ token }), [token]);
  const scope = useRef<typeof owner | null>(owner);
  const readRequest = useRef<AbortController | null>(null);
  const writeRequest = useRef<AbortController | null>(null);
  const queuedCheck = useRef(false);
  const current = useRef<{
    owner: typeof owner;
    resource: GuestIssueReportResource;
  } | null>(null);
  const [result, setResult] = useState<typeof current.current>(null);
  const publish = useCallback(
    (resource: GuestIssueReportResource) => {
      if (scope.current !== owner) return;
      const next = { owner, resource };
      current.current = next;
      setResult(next);
    },
    [owner],
  );
  const readCurrent = useCallback(
    () => (current.current?.owner === owner ? current.current.resource : null),
    [owner],
  );
  const rejectAccess = useCallback(() => {
    if (scope.current !== owner) return;
    readRequest.current?.abort();
    writeRequest.current?.abort();
    readRequest.current = null;
    writeRequest.current = null;
    queuedCheck.current = false;
    publish(unavailableGuestIssueReport());
  }, [owner, publish]);

  useLayoutEffect(() => {
    scope.current = owner;
    queuedCheck.current = false;
    return () => {
      scope.current = null;
      readRequest.current?.abort();
      writeRequest.current?.abort();
      readRequest.current = null;
      writeRequest.current = null;
      current.current = null;
    };
  }, [owner]);

  const load = useCallback(
    async (replace = false): Promise<boolean> => {
      if (scope.current !== owner) return false;
      if (owner.token === null) {
        rejectAccess();
        return false;
      }
      if (writeRequest.current) {
        queuedCheck.current = true;
        return false;
      }
      const before = readCurrent();
      if (
        replace &&
        before?.status === 'ready' &&
        (before.attempt || before.receipt)
      )
        return false;
      readRequest.current?.abort();
      const controller = new AbortController();
      readRequest.current = controller;
      const active = () =>
        scope.current === owner &&
        readRequest.current === controller &&
        !controller.signal.aborted;
      publish(
        before?.status === 'ready'
          ? { ...before, access: 'checking' }
          : { status: 'loading' },
      );
      try {
        const entry = await getGuestEntryContext(
          'qr',
          owner.token,
          controller.signal,
        );
        if (!active()) return false;
        if (
          entry.kind !== 'qr' ||
          (before?.status === 'ready' &&
            entry.context.property.id !== before.context.property.id)
        ) {
          rejectAccess();
          return false;
        }
        // Resolve QR scope before any report-specific request.
        const categories = await getGuestIssueCategories(
          owner.token,
          controller.signal,
        );
        if (!active()) return false;
        const local = readCurrent();
        if (local?.status !== 'ready' || replace) {
          publish(readyGuestIssueReport(entry.context, categories.items));
          return true;
        }
        const selected = categories.items.find(
          (category) => category.id === local.form.categoryId.toLowerCase(),
        );
        const categoryChanged =
          local.form.categoryId !== '' &&
          (!selected ||
            (local.reviewCategory !== null &&
              selected.name !== local.reviewCategory.name));
        const needsReview = !local.attempt && !local.receipt && categoryChanged;
        const recoveredMessage =
          before?.status === 'ready' && before.access === 'blocked'
            ? local.attempt
              ? guestIssueUncertainMessage
              : local.receipt
                ? '신고가 접수되었습니다.'
                : local.mutation === 'category-conflict'
                  ? guestIssueCategoryChangedMessage
                  : local.mutation === 'error'
                    ? '입력한 내용을 확인하고 다시 검토해 주세요.'
                    : ''
            : local.message;
        publish({
          ...local,
          context: entry.context,
          categories: categories.items,
          access: 'ready',
          message: recoveredMessage,
          ...(needsReview
            ? {
                mode: 'edit',
                mutation: 'category-conflict',
                reviewed: null,
                reviewCategory: null,
                message: guestIssueCategoryChangedMessage,
              }
            : {}),
        });
        return true;
      } catch (error: unknown) {
        if (!active()) return false;
        if (rejectedGuestQr(error)) rejectAccess();
        else {
          const local = readCurrent();
          const message =
            error instanceof ApiRequestError && error.status === 429
              ? '요청이 많습니다. 잠시 후 이용 정보를 다시 확인해 주세요.'
              : '휴양소 또는 신고 분류를 확인하지 못했습니다. 현재 입력은 보관 중이며 연결을 확인한 뒤 계속할 수 있습니다.';
          publish(
            local?.status === 'ready'
              ? { ...local, access: 'blocked', message }
              : { status: 'error', kind: 'request', message },
          );
        }
        return false;
      } finally {
        if (readRequest.current === controller) readRequest.current = null;
      }
    },
    [owner, publish, readCurrent, rejectAccess],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const editable = useCallback((): ReadyGuestIssueReport | null => {
    const local = readCurrent();
    return scope.current === owner &&
      local?.status === 'ready' &&
      local.access === 'ready' &&
      !local.attempt &&
      !local.receipt &&
      !local.confirmation &&
      !readRequest.current &&
      !writeRequest.current
      ? local
      : null;
  }, [owner, readCurrent]);
  const edit = useCallback(
    (change: (form: GuestIssueReportFields) => GuestIssueReportFields) => {
      const local = editable();
      if (!local || local.mode !== 'edit') return;
      const conflict = local.mutation === 'category-conflict';
      publish({
        ...local,
        form: change(local.form),
        reviewed: null,
        mutation: conflict ? 'category-conflict' : 'idle',
        message: conflict ? local.message : '',
      });
    },
    [editable, publish],
  );
  const setField = useCallback(
    <Field extends keyof GuestIssueReportFields>(
      field: Field,
      value: GuestIssueReportFields[Field],
    ) => {
      edit((form) => ({ ...form, [field]: value }));
    },
    [edit],
  );
  const review = useCallback(
    (photos: GuestIssueReportPhotoSnapshot[] | null) => {
      const local = editable();
      if (!local || local.mode !== 'edit') return;
      if (!usableGuestIssuePhotos(photos)) {
        publish({
          ...local,
          mutation:
            local.mutation === 'category-conflict' ? local.mutation : 'error',
          message:
            '사진의 업로드·삭제 결과와 유효 시간을 확인한 뒤 다시 검토해 주세요.',
        });
        return;
      }
      try {
        const body = prepareGuestIssueReport({
          ...local.form,
          requestKey: crypto.randomUUID(),
          photos: photos.map(({ id, token }) => ({ id, token })),
        });
        const category = local.categories.find(
          (item) => item.id === body.categoryId,
        );
        if (!category) {
          publish({
            ...local,
            mutation: 'category-conflict',
            message: guestIssueCategoryChangedMessage,
          });
          return;
        }
        const snapshots = photos.map((photo) => Object.freeze({ ...photo }));
        Object.freeze(snapshots);
        publish({
          ...local,
          mode: 'review',
          mutation: 'idle',
          reviewed: body,
          reviewPhotos: snapshots,
          reviewCategory: { ...category },
          message: '',
        });
      } catch (error: unknown) {
        publish({
          ...local,
          mutation:
            local.mutation === 'category-conflict' ? local.mutation : 'error',
          message:
            error instanceof ApiRequestError
              ? error.message
              : '신고 내용을 확인해 주세요.',
        });
      }
    },
    [editable, publish],
  );
  const backToEdit = useCallback(() => {
    const local = editable();
    if (!local || local.mode !== 'review') return;
    publish({
      ...local,
      mode: 'edit',
      reviewed: null,
      reviewCategory: null,
      mutation: 'idle',
      message: '',
    });
  }, [editable, publish]);

  const send = useCallback(
    async (attempt: GuestIssueReportAttempt, retry: boolean) => {
      const local = readCurrent();
      if (
        scope.current !== owner ||
        !owner.token ||
        local?.status !== 'ready' ||
        local.access !== 'ready' ||
        local.receipt ||
        readRequest.current ||
        writeRequest.current
      )
        return;
      const controller = new AbortController();
      writeRequest.current = controller;
      publish({
        ...local,
        attempt,
        mutation: 'saving',
        confirmation: null,
        message: '신고를 접수하고 있습니다…',
      });
      const active = () =>
        scope.current === owner &&
        writeRequest.current === controller &&
        !controller.signal.aborted;
      try {
        const receipt = await reportGuestIssue(
          attempt.body,
          owner.token,
          attempt.propertyId,
          controller.signal,
        );
        if (!active()) return;
        if (receipt.property.id !== attempt.propertyId)
          throw new ApiRequestError(
            '접수 응답을 확인하지 못했습니다.',
            200,
            'INVALID_GUEST_ISSUE_RECEIPT',
          );
        publish({
          ...local,
          form: emptyGuestIssueForm(),
          mode: 'received',
          mutation: 'idle',
          attempt: null,
          reviewed: null,
          reviewPhotos: [],
          reviewCategory: null,
          receipt,
          confirmation: null,
          message: '신고가 접수되었습니다.',
        });
      } catch (error: unknown) {
        if (!active()) return;
        if (rejectedGuestQr(error)) rejectAccess();
        else if (retry || unknownGuestIssueOutcome(error)) {
          // No receipt lookup exists. Only this exact request may resolve an
          // uncertain report, including after its photo claims have expired.
          publish({
            ...local,
            attempt,
            mutation: 'uncertain',
            message: guestIssueUncertainMessage,
          });
        } else if (
          error instanceof ApiRequestError &&
          error.code === 'ISSUE_CATEGORY_UNAVAILABLE'
        ) {
          publish({
            ...local,
            attempt: null,
            mode: 'edit',
            reviewed: null,
            reviewCategory: null,
            mutation: 'category-conflict',
            message: guestIssueCategoryChangedMessage,
          });
          queuedCheck.current = true;
        } else {
          publish({
            ...local,
            attempt: null,
            mode: 'edit',
            reviewed: null,
            reviewCategory: null,
            mutation: 'error',
            message:
              error instanceof ApiRequestError &&
              error.code === 'ISSUE_PHOTO_UNAVAILABLE'
                ? '접수할 수 없는 사진이 있습니다. 사진의 유효 시간과 상태를 확인하고 다시 검토해 주세요.'
                : error instanceof ApiRequestError
                  ? error.message
                  : '신고 내용을 확인해 주세요.',
          });
        }
      } finally {
        if (writeRequest.current === controller) {
          writeRequest.current = null;
          if (queuedCheck.current && scope.current === owner) {
            queuedCheck.current = false;
            void load();
          }
        }
      }
    },
    [load, owner, publish, readCurrent, rejectAccess],
  );
  const save = useCallback(
    (photos: GuestIssueReportPhotoSnapshot[] | null) => {
      const local = editable();
      if (!local || local.mode !== 'review' || !local.reviewed) return;
      if (
        !usableGuestIssuePhotos(photos) ||
        !usableGuestIssuePhotos(local.reviewPhotos) ||
        !sameGuestIssuePhotos(photos, local.reviewPhotos)
      ) {
        publish({
          ...local,
          mode: 'edit',
          reviewed: null,
          reviewCategory: null,
          mutation: 'error',
          message:
            '검토한 사진의 상태가 변경되었거나 유효 시간이 지났습니다. 사진을 확인하고 다시 검토해 주세요.',
        });
        return;
      }
      if (
        !local.categories.some(
          (category) => category.id === local.reviewed!.categoryId,
        )
      )
        return;
      void send(
        { body: local.reviewed, propertyId: local.context.property.id },
        false,
      );
    },
    [editable, publish, send],
  );
  const retry = useCallback(() => {
    const local = readCurrent();
    if (
      local?.status === 'ready' &&
      local.attempt &&
      local.mutation === 'uncertain'
    )
      void send(local.attempt, true);
  }, [readCurrent, send]);

  const cancel = useCallback(
    (hasPhotos = false): boolean => {
      const local = readCurrent();
      if (
        scope.current !== owner ||
        local?.status !== 'ready' ||
        local.attempt ||
        readRequest.current ||
        writeRequest.current
      )
        return false;
      if (dirtyGuestIssueReport(local) || hasPhotos) {
        publish({ ...local, confirmation: 'cancel' });
        return false;
      }
      return true;
    },
    [owner, publish, readCurrent],
  );
  const requestReload = useCallback(
    (hasPhotos = false) => {
      const local = readCurrent();
      if (
        scope.current !== owner ||
        readRequest.current ||
        writeRequest.current ||
        (local?.status === 'ready' && local.attempt)
      )
        return;
      if (
        local?.status === 'ready' &&
        !local.receipt &&
        (dirtyGuestIssueReport(local) || hasPhotos)
      )
        publish({ ...local, confirmation: 'reload' });
      else void load();
    },
    [load, owner, publish, readCurrent],
  );
  const confirmDiscard = useCallback(async (): Promise<boolean> => {
    const local = readCurrent();
    if (
      scope.current !== owner ||
      local?.status !== 'ready' ||
      !local.confirmation ||
      local.attempt ||
      local.receipt ||
      readRequest.current ||
      writeRequest.current
    )
      return false;
    if (local.confirmation === 'reload' || local.access !== 'ready')
      return load(true);
    publish(readyGuestIssueReport(local.context, local.categories));
    return true;
  }, [load, owner, publish, readCurrent]);
  const cancelConfirmation = useCallback(() => {
    const local = readCurrent();
    if (
      scope.current === owner &&
      local?.status === 'ready' &&
      !readRequest.current &&
      !writeRequest.current
    )
      publish({ ...local, confirmation: null });
  }, [owner, publish, readCurrent]);
  const recheck = useCallback(() => {
    void load();
  }, [load]);
  const restored = useCallback(() => {
    if (scope.current !== owner) return;
    const local = readCurrent();
    if (writeRequest.current) {
      writeRequest.current.abort();
      writeRequest.current = null;
      if (local?.status === 'ready' && local.attempt)
        publish({
          ...local,
          mutation: 'uncertain',
          message: guestIssueUncertainMessage,
        });
    }
    queuedCheck.current = false;
    void load();
  }, [load, owner, publish, readCurrent]);

  const resource: GuestIssueReportResource =
    result?.owner === owner ? result.resource : { status: 'loading' };
  const dirty = resource.status === 'ready' && dirtyGuestIssueReport(resource);
  const pending = resource.status === 'ready' && resource.mutation === 'saving';
  const protectedInput =
    dirty || (resource.status === 'ready' && resource.attempt !== null);
  useGuestIssueReportLifetime({
    token,
    warnBeforeLeave: protectedInput,
    recheck,
    restored,
  });
  return {
    resource,
    dirty,
    pending,
    protectedInput,
    edit,
    setField,
    review,
    backToEdit,
    save,
    retry,
    recheck,
    cancel,
    requestReload,
    confirmDiscard,
    cancelConfirmation,
    rejectAccess,
  };
}

export type GuestIssueReportController = ReturnType<typeof useGuestIssueReport>;
