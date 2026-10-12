import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import type { GuestDraftAnswers } from '../../../../features/guest-drafts/guest-drafts.types';
import {
  correctGuestSubmission,
  getGuestSubmissionDetail,
} from '../../../../features/guest-submission-details/guest-submission-details-api';
import {
  prepareGuestCorrection,
  sameGuestCorrectionAnswers,
} from '../../../../features/guest-submission-details/guest-submission-details-validation';
import {
  assertCurrentSubmission,
  canDiscardCorrectionAttempt,
  correctionChangedMessage,
  correctionUncertainMessage,
  dirtySubmission,
  freezeCorrectionAttempt,
  readySubmission,
  rejectedSubmissionAccess,
  submissionExpired,
  unavailableSubmission,
  unknownCorrectionOutcome,
  verifiedAttemptResult,
  type CorrectionAttempt,
  type GuestSubmissionResource,
  type ReadyGuestSubmission,
} from '../model/guest-submission-model';
import { useGuestSubmissionLifetime } from './use-guest-submission-lifetime';

export function useGuestSubmission(token: string | null) {
  // Token identity scopes this mount; credentials never become cache/storage keys.
  const owner = useMemo(() => ({ token }), [token]);
  const scope = useRef<typeof owner | null>(owner);
  const readRequest = useRef<AbortController | null>(null);
  const writeRequest = useRef<AbortController | null>(null);
  const queuedCheck = useRef(false);
  const current = useRef<{
    owner: typeof owner;
    resource: GuestSubmissionResource;
  } | null>(null);
  const [result, setResult] = useState<typeof current.current>(null);
  const publish = useCallback(
    (resource: GuestSubmissionResource) => {
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
    publish(unavailableSubmission());
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
    async (replace = false) => {
      if (scope.current !== owner) return;
      if (owner.token === null) {
        rejectAccess();
        return;
      }
      if (writeRequest.current) {
        queuedCheck.current = true;
        return;
      }
      const before = readCurrent();
      if (before?.status === 'ready' && submissionExpired(before.detail)) {
        rejectAccess();
        return;
      }
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
        const detail = await getGuestSubmissionDetail(
          owner.token,
          controller.signal,
        );
        if (!active()) return;
        if (submissionExpired(detail)) {
          rejectAccess();
          return;
        }
        const local = readCurrent();
        if (local?.status !== 'ready') {
          publish(readySubmission(detail));
          return;
        }
        assertCurrentSubmission(detail, local.latest ?? local.detail);
        if (local.attempt) {
          if (verifiedAttemptResult(local.attempt, detail)) {
            const newer =
              local.attempt.receipt !== null &&
              detail.revision > local.attempt.receipt.revision;
            publish(
              readySubmission(
                detail,
                newer
                  ? '수정 요청이 처리되었습니다. 이후에 수정된 최신 내용을 표시합니다.'
                  : '수정된 제출 내용을 확인했습니다.',
              ),
            );
          } else if (
            replace &&
            detail.revision > local.attempt.body.expectedRevision
          ) {
            // A verified advanced revision makes any old expectedRevision
            // incapable of changing current state, even if its request is late.
            publish(readySubmission(detail));
          } else {
            publish({
              ...local,
              access: 'ready',
              mutation: 'uncertain',
              latest: detail,
              confirmation: null,
              message: local.attempt.receipt
                ? '수정 요청은 처리되었지만 최신 내용이 아직 확인되지 않습니다. 다시 확인해 주세요.'
                : detail.revision > local.attempt.body.expectedRevision
                  ? '서버에 더 최신 내용이 있습니다. 이전 수정 요청의 결과는 확정할 수 없습니다. 같은 요청을 재확인하거나, 보관한 입력을 버리고 최신 내용을 검토해 주세요.'
                  : correctionUncertainMessage,
            });
          }
          return;
        }
        if (replace) {
          publish(readySubmission(detail));
        } else if (
          detail.revision !== local.detail.revision ||
          local.mutation === 'conflict'
        ) {
          publish({
            ...local,
            access: 'ready',
            latest: detail,
            mutation: 'conflict',
            message: correctionChangedMessage,
          });
        } else {
          publish({
            ...local,
            access: 'ready',
            latest: null,
            message: local.access === 'blocked' ? '' : local.message,
          });
        }
      } catch (error: unknown) {
        if (!active()) return;
        if (rejectedSubmissionAccess(error)) rejectAccess();
        else {
          const local = readCurrent();
          const message =
            error instanceof ApiRequestError && error.status === 429
              ? '요청이 많습니다. 잠시 후 다시 확인해 주세요.'
              : '최신 제출 내용을 확인하지 못했습니다. 입력을 보관 중이며 연결을 확인한 뒤 계속할 수 있습니다.';
          publish(
            local?.status === 'ready'
              ? { ...local, access: 'blocked', message }
              : { status: 'error', kind: 'request', message },
          );
        }
      } finally {
        if (readRequest.current === controller) readRequest.current = null;
      }
    },
    [owner, publish, readCurrent, rejectAccess],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const editable = useCallback((): ReadyGuestSubmission | null => {
    const local = readCurrent();
    if (
      scope.current !== owner ||
      local?.status !== 'ready' ||
      local.access !== 'ready' ||
      writeRequest.current ||
      readRequest.current ||
      local.attempt ||
      local.mutation === 'conflict' ||
      local.confirmation
    )
      return null;
    if (submissionExpired(local.detail)) {
      rejectAccess();
      return null;
    }
    return local;
  }, [owner, readCurrent, rejectAccess]);

  const startEdit = useCallback(() => {
    const local = editable();
    if (!local || local.mode !== 'view') return;
    publish({ ...local, mode: 'edit', mutation: 'idle', message: '' });
  }, [editable, publish]);
  const edit = useCallback(
    (change: (answers: GuestDraftAnswers) => GuestDraftAnswers) => {
      const local = editable();
      if (!local || local.mode !== 'edit') return;
      publish({
        ...local,
        answers: change(local.answers),
        mutation: 'idle',
        message: '',
      });
    },
    [editable, publish],
  );
  const setReason = useCallback(
    (reason: string) => {
      const local = editable();
      if (!local || local.mode !== 'edit') return;
      publish({ ...local, reason, mutation: 'idle', message: '' });
    },
    [editable, publish],
  );
  const review = useCallback(() => {
    const local = editable();
    if (!local || local.mode !== 'edit') return;
    try {
      prepareGuestCorrection(local.detail, local.answers, local.reason);
      if (sameGuestCorrectionAnswers(local.detail, local.answers)) {
        publish({
          ...local,
          mutation: 'error',
          message:
            '수정할 답변이나 메모가 없습니다. 수정 사유만으로는 저장되지 않습니다.',
        });
        return;
      }
      publish({ ...local, mode: 'review', mutation: 'idle', message: '' });
    } catch (error: unknown) {
      publish({
        ...local,
        mutation: 'error',
        message:
          error instanceof ApiRequestError
            ? error.message
            : '수정 내용을 확인해 주세요.',
      });
    }
  }, [editable, publish]);
  const backToEdit = useCallback(() => {
    const local = editable();
    if (!local || local.mode !== 'review') return;
    publish({ ...local, mode: 'edit', mutation: 'idle', message: '' });
  }, [editable, publish]);

  const send = useCallback(
    async (attempt: CorrectionAttempt, retry: boolean) => {
      const local = readCurrent();
      if (
        scope.current !== owner ||
        !owner.token ||
        local?.status !== 'ready' ||
        local.access !== 'ready' ||
        readRequest.current ||
        writeRequest.current
      )
        return;
      if (submissionExpired(local.detail)) {
        rejectAccess();
        return;
      }
      const controller = new AbortController();
      writeRequest.current = controller;
      publish({
        ...local,
        attempt,
        mutation: 'saving',
        confirmation: null,
        message: '수정 내용을 저장하고 있습니다…',
      });
      const active = () =>
        scope.current === owner &&
        writeRequest.current === controller &&
        !controller.signal.aborted;
      try {
        const receipt = await correctGuestSubmission(
          attempt.base,
          attempt.body,
          owner.token,
          controller.signal,
        );
        if (!active()) return;
        if (submissionExpired(local.detail)) {
          rejectAccess();
          return;
        }
        publish({
          ...local,
          attempt: { ...attempt, receipt },
          mutation: 'uncertain',
          access: 'checking',
          message: '수정 요청이 처리되었습니다. 최신 내용을 확인하고 있습니다…',
        });
        queuedCheck.current = true;
      } catch (error: unknown) {
        if (!active()) return;
        if (rejectedSubmissionAccess(error)) rejectAccess();
        else if (retry || unknownCorrectionOutcome(error)) {
          publish({
            ...local,
            attempt,
            mutation: 'uncertain',
            message: correctionUncertainMessage,
          });
        } else if (
          error instanceof ApiRequestError &&
          (error.status === 409 || error.code === 'SUBMISSION_CHANGED')
        ) {
          publish({
            ...local,
            attempt: null,
            mutation: 'conflict',
            message: correctionChangedMessage,
          });
          queuedCheck.current = true;
        } else {
          publish({
            ...local,
            attempt: null,
            mutation: 'error',
            message:
              error instanceof ApiRequestError
                ? error.message
                : '수정 내용을 저장하지 못했습니다.',
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
  const save = useCallback(() => {
    const local = editable();
    if (!local || local.mode !== 'review') return;
    try {
      const body = prepareGuestCorrection(
        local.detail,
        local.answers,
        local.reason,
      );
      if (sameGuestCorrectionAnswers(local.detail, local.answers)) return;
      void send(freezeCorrectionAttempt(local.detail, body), false);
    } catch (error: unknown) {
      publish({
        ...local,
        mutation: 'error',
        message:
          error instanceof ApiRequestError
            ? error.message
            : '수정 내용을 확인해 주세요.',
      });
    }
  }, [editable, publish, send]);
  const retry = useCallback(() => {
    const local = readCurrent();
    if (
      local?.status === 'ready' &&
      local.attempt &&
      local.mutation === 'uncertain'
    )
      void send(local.attempt, true);
  }, [readCurrent, send]);

  const cancel = useCallback(() => {
    const local = readCurrent();
    if (
      scope.current !== owner ||
      local?.status !== 'ready' ||
      local.attempt ||
      writeRequest.current ||
      readRequest.current
    )
      return;
    if (submissionExpired(local.detail)) {
      rejectAccess();
      return;
    }
    if (dirtySubmission(local)) publish({ ...local, confirmation: 'cancel' });
    else if (local.mutation === 'conflict' || local.access !== 'ready')
      void load(true);
    else publish(readySubmission(local.detail));
  }, [load, owner, publish, readCurrent, rejectAccess]);
  const requestReload = useCallback(() => {
    const local = readCurrent();
    if (scope.current !== owner || writeRequest.current || readRequest.current)
      return;
    if (local?.status !== 'ready') {
      void load(true);
      return;
    }
    if (local.attempt && !canDiscardCorrectionAttempt(local)) return;
    if (
      dirtySubmission(local) ||
      local.mutation === 'conflict' ||
      local.attempt
    )
      publish({ ...local, confirmation: 'reload' });
    else void load(true);
  }, [load, owner, publish, readCurrent]);
  const confirmDiscard = useCallback(() => {
    const local = readCurrent();
    if (
      scope.current !== owner ||
      local?.status !== 'ready' ||
      !local.confirmation ||
      writeRequest.current ||
      readRequest.current
    )
      return;
    if (submissionExpired(local.detail)) {
      rejectAccess();
      return;
    }
    if (local.attempt && !canDiscardCorrectionAttempt(local)) return;
    if (
      local.confirmation === 'cancel' &&
      local.access === 'ready' &&
      !local.latest &&
      local.mutation !== 'conflict'
    )
      publish(readySubmission(local.detail));
    else void load(true);
  }, [load, owner, publish, readCurrent, rejectAccess]);
  const cancelDiscard = useCallback(() => {
    const local = readCurrent();
    if (
      scope.current === owner &&
      local?.status === 'ready' &&
      !writeRequest.current &&
      !readRequest.current
    )
      publish({ ...local, confirmation: null });
  }, [owner, publish, readCurrent]);

  const resource: GuestSubmissionResource =
    result?.owner === owner ? result.resource : { status: 'loading' };
  const dirty = resource.status === 'ready' && dirtySubmission(resource);
  const pending = resource.status === 'ready' && resource.attempt !== null;
  const recheck = useCallback(() => {
    void load();
  }, [load]);
  const restored = useCallback(() => {
    const local = readCurrent();
    if (writeRequest.current) {
      writeRequest.current.abort();
      writeRequest.current = null;
      if (local?.status === 'ready' && local.attempt)
        publish({
          ...local,
          mutation: 'uncertain',
          message: correctionUncertainMessage,
        });
    }
    queuedCheck.current = false;
    void load();
  }, [load, publish, readCurrent]);
  useGuestSubmissionLifetime({
    token,
    expiresAt: resource.status === 'ready' ? resource.detail.expiresAt : null,
    warnBeforeLeave: dirty || pending,
    recheck,
    restored,
    rejectAccess,
  });

  const hasPendingWork = useCallback(() => {
    const local = readCurrent();
    return (
      scope.current === owner &&
      local?.status === 'ready' &&
      (dirtySubmission(local) ||
        local.attempt !== null ||
        writeRequest.current !== null)
    );
  }, [owner, readCurrent]);

  return {
    hasPendingWork,
    resource,
    dirty,
    hasChanges:
      resource.status === 'ready' &&
      !sameGuestCorrectionAnswers(resource.detail, resource.answers),
    canDiscardAttempt:
      resource.status === 'ready' && canDiscardCorrectionAttempt(resource),
    startEdit,
    edit,
    setReason,
    review,
    backToEdit,
    save,
    retry,
    recheck,
    cancel,
    requestReload,
    confirmDiscard,
    cancelDiscard,
    rejectAccess,
  };
}

export type GuestSubmissionController = ReturnType<typeof useGuestSubmission>;
