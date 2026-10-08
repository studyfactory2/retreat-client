import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import {
  getGuestDraft,
  saveGuestDraft,
} from '../../../../features/guest-drafts/guest-drafts-api';
import type {
  GuestDraftAnswers,
  GuestDraftDto,
} from '../../../../features/guest-drafts/guest-drafts.types';
import {
  getGuestSubmissionReceipt,
  submitGuestChecklist,
} from '../../../../features/guest-submissions/guest-submissions-api';
import type {
  GuestSubmissionPhotoInput,
  GuestSubmissionReceiptDto,
} from '../../../../features/guest-submissions/guest-submissions.types';
import type { GuestDraftPhotoListDto } from '../../../../features/guest-draft-photos/guest-draft-photos.types';
import {
  draftChangedMessage,
  draftUncertainMessage,
  sameDraftAnswers,
} from '../model/guest-draft-model';

export type SubmissionAttempt = {
  draft: GuestDraftDto;
  photos: GuestSubmissionPhotoInput[];
};
export type DraftResource =
  | { status: 'loading' }
  | {
      status: 'error';
      kind: 'unavailable' | 'unsupported' | 'request';
      message: string;
    }
  | { status: 'submitted'; receipt: GuestSubmissionReceiptDto }
  | {
      status: 'ready';
      draft: GuestDraftDto;
      answers: GuestDraftAnswers;
      access: 'ready' | 'checking' | 'blocked';
      mutation:
        | 'idle'
        | 'saving'
        | 'saved'
        | 'error'
        | 'conflict'
        | 'uncertain'
        | 'submitting'
        | 'submission-uncertain';
      attempt: SubmissionAttempt | null;
      message: string;
    };

type ReadyDraft = Extract<DraftResource, { status: 'ready' }>;
const submissionUncertain =
  '제출 결과를 확인하지 못했습니다. 이미 제출되었을 수 있어 수정과 사진 변경을 잠시 멈췄습니다. 제출 결과를 다시 확인해 주세요.';
function unavailable(): DraftResource {
  return {
    status: 'error',
    kind: 'unavailable',
    message:
      '이 작성 링크를 사용할 수 없습니다. 전달받은 링크를 확인하거나 관리자에게 문의해 주세요.',
  };
}
function isExpired(value: { expiresAt: string }): boolean {
  return Date.parse(value.expiresAt) <= Date.now();
}
function needsReview(resource: ReadyDraft): boolean {
  return (
    resource.mutation === 'uncertain' ||
    resource.mutation === 'conflict' ||
    resource.attempt !== null
  );
}
function unknownOutcome(error: unknown): boolean {
  return (
    !(error instanceof ApiRequestError) ||
    error.status === null ||
    error.status < 400 ||
    error.status >= 500 ||
    error.status === 408
  );
}
function assertSameReceipt(
  receipt: GuestSubmissionReceiptDto,
  previous: DraftResource | null,
) {
  const known =
    previous?.status === 'ready'
      ? previous.draft
      : previous?.status === 'submitted'
        ? previous.receipt
        : null;
  if (
    known &&
    (receipt.id !== known.id ||
      receipt.type !== known.type ||
      receipt.property.id !== known.property.id ||
      receipt.visitDate !== known.visitDate ||
      receipt.expiresAt !== known.expiresAt)
  ) {
    throw new ApiRequestError(
      '제출 확인 내용이 작성 링크와 일치하지 않습니다. 다시 확인해 주세요.',
      200,
      'INVALID_GUEST_SUBMISSION_RESPONSE',
    );
  }
}
function rejectAccess(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    (error.status === 401 || error.status === 403)
  );
}

export function useGuestDraft(token: string | null) {
  // The credential owns this mounted session; it is never a serialized key.
  const owner = useMemo(() => ({ token }), [token]);
  const scope = useRef<typeof owner | null>(owner);
  const readRequest = useRef<AbortController | null>(null);
  const writeRequest = useRef<AbortController | null>(null);
  const queuedCheck = useRef(false);
  const current = useRef<{
    owner: typeof owner;
    resource: DraftResource;
  } | null>(null);
  const [result, setResult] = useState<typeof current.current>(null);
  const publish = useCallback(
    (resource: DraftResource) => {
      if (scope.current !== owner) return;
      const next = { owner, resource };
      current.current = next;
      setResult(next);
    },
    [owner],
  );
  const readCurrent = useCallback(
    (): DraftResource | null =>
      current.current?.owner === owner ? current.current.resource : null,
    [owner],
  );

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
    async (replace: boolean) => {
      if (scope.current !== owner || owner.token === null) return;
      if (writeRequest.current) {
        queuedCheck.current = true;
        return;
      }
      readRequest.current?.abort();
      const controller = new AbortController();
      readRequest.current = controller;
      const active = () =>
        scope.current === owner &&
        readRequest.current === controller &&
        !controller.signal.aborted;
      const before = readCurrent();
      publish(
        before?.status === 'ready'
          ? { ...before, access: 'checking' }
          : { status: 'loading' },
      );
      try {
        const receipt = await getGuestSubmissionReceipt(
          owner.token,
          controller.signal,
        );
        if (!active()) return;
        if (receipt) {
          assertSameReceipt(receipt, before);
          publish(
            isExpired(receipt)
              ? unavailable()
              : { status: 'submitted', receipt },
          );
          return;
        }
        const pending = readCurrent();
        if (pending?.status === 'ready' && pending.attempt) {
          publish({
            ...pending,
            access: 'ready',
            mutation: 'submission-uncertain',
            message:
              '현재 제출 기록은 확인되지 않습니다. 이전 요청이 아직 처리 중일 수 있습니다. 다시 확인하거나 같은 내용으로 제출을 재확인해 주세요.',
          });
          return;
        }
        let draft: GuestDraftDto;
        try {
          draft = await getGuestDraft(owner.token, controller.signal);
        } catch (error: unknown) {
          // Another window may submit between the receipt read and the draft read.
          if (rejectAccess(error)) {
            const completed = await getGuestSubmissionReceipt(
              owner.token,
              controller.signal,
            );
            if (!active()) return;
            if (completed) {
              assertSameReceipt(completed, before);
              publish(
                isExpired(completed)
                  ? unavailable()
                  : { status: 'submitted', receipt: completed },
              );
              return;
            }
          }
          throw error;
        }
        if (!active()) return;
        if (isExpired(draft)) {
          publish(unavailable());
          return;
        }
        const local = readCurrent();
        if (
          !replace &&
          local?.status === 'ready' &&
          (!sameDraftAnswers(local.answers, local.draft.answers) ||
            needsReview(local))
        ) {
          if (
            draft.id !== local.draft.id ||
            draft.updatedAt !== local.draft.updatedAt
          ) {
            publish({
              ...local,
              access: 'ready',
              mutation: 'conflict',
              message: draftChangedMessage,
            });
          } else
            publish({
              ...local,
              access: 'ready',
              message:
                local.mutation === 'uncertain'
                  ? draftUncertainMessage
                  : local.mutation === 'conflict'
                    ? draftChangedMessage
                    : '',
            });
        } else
          publish({
            status: 'ready',
            draft,
            answers: draft.answers,
            access: 'ready',
            mutation: 'idle',
            attempt: null,
            message: '',
          });
      } catch (error: unknown) {
        if (!active()) return;
        if (rejectAccess(error)) publish(unavailable());
        else if (
          error instanceof ApiRequestError &&
          (error.code === 'UNSUPPORTED_GUEST_DRAFT' ||
            error.code === 'GUEST_SUBMISSION_TYPE_UNSUPPORTED')
        ) {
          publish({
            status: 'error',
            kind: 'unsupported',
            message:
              '이 화면은 이용객의 입실·퇴실 체크 전용입니다. 정비 작성은 직원용 안내를 이용해 주세요.',
          });
        } else {
          const message =
            error instanceof ApiRequestError && error.status === 429
              ? '요청이 많습니다. 잠시 후 연결을 다시 확인해 주세요.'
              : '저장 또는 제출 상태를 확인하지 못했습니다. 입력은 유지되지만 연결을 확인하기 전까지 변경할 수 없습니다.';
          const local = readCurrent();
          publish(
            local?.status === 'ready'
              ? { ...local, access: 'blocked', message }
              : {
                  status: 'error',
                  kind: 'request',
                  message:
                    '작성 또는 제출 내용을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.',
                },
          );
        }
      } finally {
        if (readRequest.current === controller) readRequest.current = null;
      }
    },
    [owner, publish, readCurrent],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  const edit = useCallback(
    (change: (answers: GuestDraftAnswers) => GuestDraftAnswers) => {
      const local = readCurrent();
      if (
        scope.current !== owner ||
        local?.status !== 'ready' ||
        local.access !== 'ready' ||
        writeRequest.current ||
        needsReview(local)
      )
        return;
      if (isExpired(local.draft)) {
        publish(unavailable());
        return;
      }
      publish({
        ...local,
        answers: change(local.answers),
        mutation: 'idle',
        message: '',
      });
    },
    [owner, publish, readCurrent],
  );

  const save = useCallback(async (): Promise<GuestDraftDto | null> => {
    const local = readCurrent();
    if (
      scope.current !== owner ||
      !owner.token ||
      writeRequest.current ||
      readRequest.current ||
      local?.status !== 'ready' ||
      local.access !== 'ready' ||
      needsReview(local)
    )
      return null;
    if (isExpired(local.draft)) {
      publish(unavailable());
      return null;
    }
    if (sameDraftAnswers(local.answers, local.draft.answers))
      return local.draft;
    const controller = new AbortController();
    writeRequest.current = controller;
    publish({ ...local, mutation: 'saving', message: '' });
    const active = () =>
      scope.current === owner &&
      writeRequest.current === controller &&
      !controller.signal.aborted;
    try {
      const draft = await saveGuestDraft(
        local.draft,
        local.answers,
        owner.token,
        controller.signal,
      );
      if (!active()) return null;
      publish(
        isExpired(draft)
          ? unavailable()
          : {
              status: 'ready',
              draft,
              answers: draft.answers,
              access: 'ready',
              mutation: 'saved',
              attempt: null,
              message: '임시 저장했습니다. 아직 최종 제출되지 않았습니다.',
            },
      );
      return isExpired(draft) ? null : draft;
    } catch (error: unknown) {
      if (!active()) return null;
      if (rejectAccess(error)) {
        queuedCheck.current = true;
        publish({ ...local, access: 'checking' });
      } else if (
        error instanceof ApiRequestError &&
        (error.code === 'DRAFT_CHANGED' || error.status === 409)
      ) {
        publish({
          ...local,
          mutation: 'conflict',
          message: draftChangedMessage,
        });
      } else if (unknownOutcome(error))
        publish({
          ...local,
          mutation: 'uncertain',
          message: draftUncertainMessage,
        });
      else
        publish({
          ...local,
          mutation: 'error',
          message:
            error instanceof ApiRequestError
              ? error.message
              : draftUncertainMessage,
        });
      return null;
    } finally {
      if (writeRequest.current === controller) {
        writeRequest.current = null;
        if (queuedCheck.current && scope.current === owner) {
          queuedCheck.current = false;
          void load(false);
        }
      }
    }
  }, [owner, publish, readCurrent, load]);

  const submit = useCallback(
    async (
      photos: GuestSubmissionPhotoInput[],
      expectedUpdatedAt: string,
      refreshPhotos?: () => Promise<GuestDraftPhotoListDto | null>,
    ) => {
      const local = readCurrent();
      if (
        scope.current !== owner ||
        !owner.token ||
        writeRequest.current ||
        readRequest.current ||
        local?.status !== 'ready' ||
        local.access !== 'ready'
      )
        return;
      const retry =
        local.mutation === 'submission-uncertain' && local.attempt !== null;
      if (
        !retry &&
        (needsReview(local) ||
          !sameDraftAnswers(local.answers, local.draft.answers) ||
          local.draft.updatedAt !== expectedUpdatedAt)
      )
        return;
      if (isExpired(local.draft)) {
        publish(unavailable());
        return;
      }
      // This payload remains immutable until its outcome is known. Ordering matters to the backend retry hash.
      const attempt = retry
        ? local.attempt!
        : {
            draft: structuredClone(local.draft),
            photos: photos.map((photo) => ({ ...photo })),
          };
      const controller = new AbortController();
      writeRequest.current = controller;
      publish({
        ...local,
        mutation: 'submitting',
        attempt,
        message: '제출 내용을 확인하고 있습니다…',
      });
      const active = () =>
        scope.current === owner &&
        writeRequest.current === controller &&
        !controller.signal.aborted;
      let sent = retry;
      try {
        if (!retry) {
          const latest = await refreshPhotos?.();
          if (!active()) return;
          if (!latest) {
            publish({
              ...local,
              mutation: 'error',
              attempt: null,
              message:
                '사진 상태를 확인하지 못했습니다. 사진 목록을 다시 확인한 뒤 검토해 주세요.',
            });
            return;
          }
          const ids = new Set(
            attempt.photos.map((photo) => photo.attachmentId),
          );
          if (
            latest.items.length !== ids.size ||
            latest.items.some((photo) => !ids.has(photo.id))
          ) {
            publish({
              ...local,
              mutation: 'error',
              attempt: null,
              message:
                '사진 목록이 변경되었습니다. 모든 사진의 연결 항목을 다시 확인해 주세요.',
            });
            return;
          }
        }
        if (!active()) return;
        sent = true;
        const receipt = await submitGuestChecklist(
          attempt.draft,
          attempt.photos,
          owner.token,
          controller.signal,
        );
        if (!active()) return;
        publish(
          isExpired(receipt) ? unavailable() : { status: 'submitted', receipt },
        );
      } catch (error: unknown) {
        if (!active()) return;
        if (
          error instanceof ApiRequestError &&
          error.code === 'CHECKLIST_ALREADY_SUBMITTED'
        ) {
          publish({
            ...local,
            mutation: 'submission-uncertain',
            attempt,
            message:
              '이미 제출된 기록이 있습니다. 제출 확인 화면을 불러옵니다.',
          });
          queuedCheck.current = true;
        } else if (rejectAccess(error)) {
          publish({
            ...local,
            mutation: sent ? 'submission-uncertain' : 'error',
            attempt: sent ? attempt : null,
            message: submissionUncertain,
          });
          queuedCheck.current = true;
        } else if (retry || (sent && unknownOutcome(error))) {
          publish({
            ...local,
            mutation: 'submission-uncertain',
            attempt,
            message: submissionUncertain,
          });
        } else if (
          error instanceof ApiRequestError &&
          error.code === 'DRAFT_CHANGED'
        ) {
          publish({
            ...local,
            mutation: 'conflict',
            attempt: null,
            message: draftChangedMessage,
          });
        } else {
          const message =
            error instanceof ApiRequestError &&
            error.code === 'PHOTO_UPLOAD_PENDING'
              ? '처리 중인 사진이 있습니다. 잠시 후 사진 목록을 확인하고 다시 검토해 주세요.'
              : error instanceof ApiRequestError &&
                  error.code === 'SUBMISSION_PHOTOS_CHANGED'
                ? '사진 목록이 변경되었습니다. 사진 목록과 연결 항목을 다시 확인해 주세요.'
                : error instanceof ApiRequestError
                  ? error.message
                  : '제출 준비를 마치지 못했습니다. 다시 검토해 주세요.';
          publish({ ...local, mutation: 'error', attempt: null, message });
        }
      } finally {
        if (writeRequest.current === controller) {
          writeRequest.current = null;
          if (queuedCheck.current && scope.current === owner) {
            queuedCheck.current = false;
            void load(false);
          }
        }
      }
    },
    [owner, publish, readCurrent, load],
  );

  const reload = useCallback(() => {
    const local = readCurrent();
    if (
      writeRequest.current ||
      scope.current !== owner ||
      (local?.status === 'ready' && local.attempt)
    )
      return;
    if (
      local?.status === 'ready' &&
      (!sameDraftAnswers(local.answers, local.draft.answers) ||
        needsReview(local)) &&
      !window.confirm(
        '현재 화면의 입력을 버리고 서버에 저장된 내용을 불러올까요? 불러온 내용을 확인한 뒤 다시 작성해 주세요.',
      )
    )
      return;
    void load(true);
  }, [load, owner, readCurrent]);

  useEffect(() => {
    if (token === null) return;
    let wasAway = document.visibilityState === 'hidden';
    const leave = () => {
      wasAway = true;
    };
    const resume = () => {
      if (!wasAway || document.visibilityState === 'hidden') return;
      wasAway = false;
      void load(false);
    };
    const visibility = () =>
      document.visibilityState === 'hidden' ? leave() : resume();
    const restored = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      wasAway = false;
      const local = readCurrent();
      if (writeRequest.current) {
        writeRequest.current.abort();
        writeRequest.current = null;
        if (local?.status === 'ready')
          publish({
            ...local,
            mutation: local.attempt ? 'submission-uncertain' : 'uncertain',
            message: local.attempt
              ? submissionUncertain
              : draftUncertainMessage,
          });
      }
      queuedCheck.current = false;
      void load(false);
    };
    window.addEventListener('blur', leave);
    window.addEventListener('focus', resume);
    window.addEventListener('pagehide', leave);
    window.addEventListener('pageshow', restored);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('blur', leave);
      window.removeEventListener('focus', resume);
      window.removeEventListener('pagehide', leave);
      window.removeEventListener('pageshow', restored);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [load, publish, readCurrent, token]);

  const resource: DraftResource =
    result?.owner === owner ? result.resource : { status: 'loading' };
  const expiry =
    resource.status === 'ready'
      ? resource.draft.expiresAt
      : resource.status === 'submitted'
        ? resource.receipt.expiresAt
        : null;
  useEffect(() => {
    if (!expiry) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(
        () => {
          if (scope.current !== owner) return;
          if (Date.parse(expiry) > Date.now()) {
            schedule();
            return;
          }
          readRequest.current?.abort();
          writeRequest.current?.abort();
          readRequest.current = null;
          writeRequest.current = null;
          publish(unavailable());
        },
        Math.min(Math.max(0, Date.parse(expiry) - Date.now()), 2_147_483_647),
      );
    };
    schedule();
    return () => clearTimeout(timer);
  }, [expiry, owner, publish]);

  const dirty =
    resource.status === 'ready' &&
    !sameDraftAnswers(resource.answers, resource.draft.answers);
  const saving =
    resource.status === 'ready' &&
    (resource.mutation === 'saving' || resource.attempt !== null);
  useEffect(() => {
    if (!dirty && !saving) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, saving]);

  const hasPendingWork = useCallback(() => {
    const local = readCurrent();
    return (
      local?.status === 'ready' &&
      (writeRequest.current !== null ||
        needsReview(local) ||
        !sameDraftAnswers(local.answers, local.draft.answers))
    );
  }, [readCurrent]);

  return {
    hasPendingWork,
    resource,
    dirty,
    edit,
    save,
    submit,
    reload,
    recheck: () => {
      void load(false);
    },
  };
}
