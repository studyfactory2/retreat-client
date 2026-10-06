import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import type { StaffDraftDto } from '../../../../features/staff-drafts/staff-drafts.types';
import {
  getStaffSubmissionReceipt,
  submitStaffChecklist,
} from '../../../../features/staff-submissions/staff-submissions-api';
import type {
  StaffSubmissionPhotoInput,
  StaffSubmissionReceiptDto,
} from '../../../../features/staff-submissions/staff-submissions.types';

type SubmissionAttempt = {
  draft: StaffDraftDto;
  photos: StaffSubmissionPhotoInput[];
};
export type StaffSubmissionState = {
  status:
    | 'idle'
    | 'submitting'
    | 'checking'
    | 'uncertain'
    | 'submitted'
    | 'unavailable';
  message: string;
  canRetry: boolean;
  receipt: StaffSubmissionReceiptDto | null;
};
type Options = {
  token: string;
  draft: StaffDraftDto;
  canSubmit: boolean;
  onLockChange: (locked: boolean) => void;
  onSubmitted: (receipt: StaffSubmissionReceiptDto) => void;
  onAccessRejected: () => void;
  onDraftRefresh: () => void;
};
type Operation = { controller: AbortController; kind: 'read' | 'write' };
const initialState = (): StaffSubmissionState => ({
  status: 'idle',
  message: '',
  canRetry: false,
  receipt: null,
});
const uncertainMessage =
  '제출 결과를 확인하지 못했습니다. 이미 제출되었을 수 있어 답변과 사진 변경을 멈췄습니다. 제출 결과를 먼저 확인해 주세요.';

function accessRejected(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    (error.status === 401 ||
      error.status === 403 ||
      error.code === 'INVALID_DRAFT_ACCESS')
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
function sameReceiptDraft(
  receipt: StaffSubmissionReceiptDto,
  draft: StaffDraftDto,
): boolean {
  return (
    receipt.id === draft.id &&
    receipt.type === draft.type &&
    receipt.property.id === draft.property.id &&
    receipt.visitDate === draft.visitDate &&
    receipt.startedAt === draft.startedAt &&
    receipt.expiresAt === draft.expiresAt
  );
}

export function useStaffSubmission(input: Options) {
  const owner = useMemo(
    () => ({ token: input.token, draftId: input.draft.id }),
    [input.token, input.draft.id],
  );
  const scope = useRef<typeof owner | null>(owner);
  const options = useRef(input);
  const operation = useRef<Operation | null>(null);
  const attempt = useRef<SubmissionAttempt | null>(null);
  const queuedCheck = useRef(false);
  const current = useRef<{
    owner: typeof owner;
    state: StaffSubmissionState;
  } | null>(null);
  const [result, setResult] = useState<typeof current.current>(null);
  useLayoutEffect(() => {
    options.current = input;
  });
  useLayoutEffect(() => {
    scope.current = owner;
    attempt.current = null;
    queuedCheck.current = false;
    current.current = null;
    return () => {
      scope.current = null;
      operation.current?.controller.abort();
      operation.current = null;
      attempt.current = null;
      queuedCheck.current = false;
      current.current = null;
      // The parent owns its lock after this form is replaced or completed.
    };
  }, [owner]);
  const read = useCallback(
    () =>
      current.current?.owner === owner ? current.current.state : initialState(),
    [owner],
  );
  const publish = useCallback(
    (state: StaffSubmissionState) => {
      if (scope.current !== owner) return;
      const next = { owner, state };
      current.current = next;
      setResult(next);
    },
    [owner],
  );
  const reject = useCallback(() => {
    if (scope.current !== owner) return;
    operation.current?.controller.abort();
    operation.current = null;
    attempt.current = null;
    queuedCheck.current = false;
    publish({
      ...initialState(),
      status: 'unavailable',
      message:
        '이 작성 링크를 사용할 수 없습니다. 개인 링크를 다시 확인해 주세요.',
    });
    options.current.onLockChange(true);
    options.current.onAccessRejected();
  }, [owner, publish]);
  const alive = useCallback(() => {
    if (scope.current !== owner || read().status === 'unavailable')
      return false;
    const draft = attempt.current?.draft ?? options.current.draft;
    if (Date.parse(draft.expiresAt) <= Date.now()) {
      reject();
      return false;
    }
    return true;
  }, [owner, read, reject]);
  const accept = useCallback(
    (receipt: StaffSubmissionReceiptDto) => {
      const draft = attempt.current?.draft ?? options.current.draft;
      if (!sameReceiptDraft(receipt, draft))
        throw new ApiRequestError(
          '제출 내역이 작성 링크와 일치하지 않습니다. 다시 확인해 주세요.',
          200,
          'INVALID_STAFF_SUBMISSION_RESPONSE',
        );
      if (Date.parse(receipt.expiresAt) <= Date.now()) {
        reject();
        return;
      }
      attempt.current = null;
      queuedCheck.current = false;
      publish({
        status: 'submitted',
        receipt,
        canRetry: false,
        message: '정비 기록을 제출했습니다.',
      });
      options.current.onSubmitted(receipt);
    },
    [publish, reject],
  );
  const checkReceipt = useCallback(async () => {
    if (!alive() || !attempt.current || read().status === 'submitted') return;
    if (operation.current) {
      if (operation.current.kind === 'write') queuedCheck.current = true;
      return;
    }
    const job: Operation = { controller: new AbortController(), kind: 'read' };
    operation.current = job;
    options.current.onLockChange(true);
    publish({
      ...initialState(),
      status: 'checking',
      message: '제출 결과를 확인하고 있습니다.',
    });
    const active = () =>
      scope.current === owner &&
      operation.current === job &&
      !job.controller.signal.aborted;
    try {
      const receipt = await getStaffSubmissionReceipt(
        owner.token,
        job.controller.signal,
      );
      if (!active() || !alive()) return;
      if (receipt) accept(receipt);
      else
        publish({
          ...initialState(),
          status: 'uncertain',
          canRetry: true,
          message:
            '현재 제출 기록은 확인되지 않습니다. 이전 요청이 아직 처리 중일 수 있습니다. 다시 확인하거나 처음 검토한 같은 내용으로 제출을 재확인해 주세요.',
        });
    } catch (error: unknown) {
      if (!active()) return;
      if (accessRejected(error)) reject();
      else
        publish({
          ...initialState(),
          status: 'uncertain',
          message:
            '제출 내역을 불러오지 못했습니다. 답변과 사진은 그대로 두고 잠시 후 제출 결과를 다시 확인해 주세요.',
        });
    } finally {
      if (operation.current === job) operation.current = null;
    }
  }, [accept, alive, owner, publish, read, reject]);

  const send = useCallback(
    async (frozen: SubmissionAttempt, replay: boolean) => {
      if (!alive() || operation.current) return;
      attempt.current = frozen;
      const job: Operation = {
        controller: new AbortController(),
        kind: 'write',
      };
      operation.current = job;
      // Stop parent saves and focus reads before a request can reach the server.
      options.current.onLockChange(true);
      publish({
        ...initialState(),
        status: 'submitting',
        message: replay
          ? '처음 검토한 같은 내용으로 제출을 확인하고 있습니다.'
          : '정비 기록을 제출하고 있습니다.',
      });
      const active = () =>
        scope.current === owner &&
        operation.current === job &&
        !job.controller.signal.aborted;
      try {
        const receipt = await submitStaffChecklist(
          frozen.draft,
          frozen.photos,
          owner.token,
          job.controller.signal,
        );
        if (!active() || !alive()) return;
        accept(receipt);
      } catch (error: unknown) {
        if (!active()) return;
        if (
          replay ||
          unknownOutcome(error) ||
          accessRejected(error) ||
          (error instanceof ApiRequestError &&
            error.code === 'CHECKLIST_ALREADY_SUBMITTED')
        ) {
          publish({
            ...initialState(),
            status: 'uncertain',
            message: uncertainMessage,
          });
          queuedCheck.current = true;
        } else {
          attempt.current = null;
          queuedCheck.current = false;
          publish({
            ...initialState(),
            message:
              error instanceof ApiRequestError
                ? error.message
                : '제출 준비를 마치지 못했습니다. 저장 상태와 사진을 다시 확인해 주세요.',
          });
          options.current.onLockChange(false);
          options.current.onDraftRefresh();
        }
      } finally {
        if (operation.current === job) {
          operation.current = null;
          if (queuedCheck.current && scope.current === owner) {
            queuedCheck.current = false;
            void checkReceipt();
          }
        }
      }
    },
    [accept, alive, checkReceipt, owner, publish],
  );
  const submit = useCallback(
    (photos: StaffSubmissionPhotoInput[], expectedUpdatedAt: string) => {
      if (
        !alive() ||
        operation.current ||
        attempt.current ||
        read().status !== 'idle' ||
        !options.current.canSubmit ||
        options.current.draft.updatedAt !== expectedUpdatedAt
      )
        return;
      // Preserve both ordering and values for the backend's idempotent request hash.
      const frozen = {
        draft: structuredClone(options.current.draft),
        photos: photos.map((photo) => ({ ...photo })),
      };
      void send(frozen, false);
    },
    [alive, read, send],
  );
  const retrySame = useCallback(() => {
    if (
      !alive() ||
      operation.current ||
      !attempt.current ||
      read().status !== 'uncertain' ||
      !read().canRetry
    )
      return;
    void send(attempt.current, true);
  }, [alive, read, send]);
  const hasPendingWork = useCallback(
    () => scope.current === owner && attempt.current !== null,
    [owner],
  );
  const pause = useCallback(() => {
    if (scope.current !== owner || !attempt.current) return;
    operation.current?.controller.abort();
    operation.current = null;
    queuedCheck.current = false;
    publish({
      ...initialState(),
      status: 'uncertain',
      message: uncertainMessage,
    });
  }, [owner, publish]);

  useEffect(() => {
    let away = document.visibilityState === 'hidden';
    const leave = () => {
      away = true;
    };
    const resume = () => {
      if (!away || document.visibilityState === 'hidden') return;
      away = false;
      void checkReceipt();
    };
    const visibility = () =>
      document.visibilityState === 'hidden' ? leave() : resume();
    const hidden = () => {
      leave();
      pause();
    };
    const restored = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      away = false;
      pause();
      void checkReceipt();
    };
    const warn = (event: BeforeUnloadEvent) => {
      if (!hasPendingWork()) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('blur', leave);
    window.addEventListener('focus', resume);
    window.addEventListener('pagehide', hidden);
    window.addEventListener('pageshow', restored);
    window.addEventListener('beforeunload', warn);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('blur', leave);
      window.removeEventListener('focus', resume);
      window.removeEventListener('pagehide', hidden);
      window.removeEventListener('pageshow', restored);
      window.removeEventListener('beforeunload', warn);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [checkReceipt, hasPendingWork, pause]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(
        () => {
          if (scope.current !== owner) return;
          if (Date.parse(input.draft.expiresAt) > Date.now()) schedule();
          else reject();
        },
        Math.min(
          Math.max(0, Date.parse(input.draft.expiresAt) - Date.now()),
          2_147_483_647,
        ),
      );
    };
    schedule();
    return () => clearTimeout(timer);
  }, [input.draft.expiresAt, owner, reject]);

  const state = result?.owner === owner ? result.state : initialState();
  return {
    state,
    submitting: state.status === 'submitting',
    locked: state.status !== 'idle',
    hasPendingWork,
    submit,
    checkReceipt,
    retrySame,
  };
}

export type StaffSubmissionController = ReturnType<typeof useStaffSubmission>;
