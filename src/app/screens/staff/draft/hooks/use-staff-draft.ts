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
  getStaffDraft,
  saveStaffDraft,
} from '../../../../features/staff-drafts/staff-drafts-api';
import { sameStaffDraftAnswers } from '../../../../features/staff-drafts/staff-draft-answers';
import type {
  StaffDraftAnswer,
  StaffDraftAnswers,
  StaffDraftDto,
} from '../../../../features/staff-drafts/staff-drafts.types';
import {
  changeStaffDraftAnswer,
  requiresStaffAnswerDiscardConfirmation,
  sameStaffDraftIdentity,
  staffDraftChangedMessage,
  staffDraftUncertainMessage,
} from '../model/staff-draft-model';

export type StaffDraftResource =
  | { status: 'loading' }
  | {
      status: 'error';
      kind: 'unavailable' | 'unsupported' | 'request';
      message: string;
    }
  | {
      status: 'ready';
      draft: StaffDraftDto;
      answers: StaffDraftAnswers;
      access: 'ready' | 'checking' | 'blocked';
      mutation:
        | 'idle'
        | 'saving'
        | 'saved'
        | 'error'
        | 'conflict'
        | 'uncertain';
      message: string;
    };
type ReadyDraft = Extract<StaffDraftResource, { status: 'ready' }>;

function unavailable(): StaffDraftResource {
  return {
    status: 'error',
    kind: 'unavailable',
    message:
      '이 작성 링크를 사용할 수 없습니다. 전달받은 링크를 확인하거나 관리자에게 문의해 주세요.',
  };
}
function expired(draft: StaffDraftDto): boolean {
  return Date.parse(draft.expiresAt) <= Date.now();
}
function needsReview(resource: ReadyDraft): boolean {
  return resource.mutation === 'uncertain' || resource.mutation === 'conflict';
}
function hasLocalWork(resource: ReadyDraft): boolean {
  return (
    resource.mutation === 'saving' ||
    needsReview(resource) ||
    !sameStaffDraftAnswers(resource.answers, resource.draft.answers)
  );
}
function rejected(error: unknown): boolean {
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

export function useStaffDraft(token: string | null) {
  // Raw credentials only own this in-memory session; they are never cache keys.
  const owner = useMemo(() => ({ token }), [token]);
  const scope = useRef<typeof owner | null>(owner);
  const readRequest = useRef<AbortController | null>(null);
  const writeRequest = useRef<AbortController | null>(null);
  const current = useRef<{
    owner: typeof owner;
    resource: StaffDraftResource;
  } | null>(null);
  const [result, setResult] = useState<typeof current.current>(null);
  const publish = useCallback(
    (resource: StaffDraftResource) => {
      if (scope.current !== owner) return;
      const next = { owner, resource };
      current.current = next;
      setResult(next);
    },
    [owner],
  );
  const readCurrent = useCallback(
    (): StaffDraftResource | null =>
      current.current?.owner === owner ? current.current.resource : null,
    [owner],
  );
  const abortRequests = useCallback(() => {
    readRequest.current?.abort();
    writeRequest.current?.abort();
    readRequest.current = null;
    writeRequest.current = null;
  }, []);

  useLayoutEffect(() => {
    scope.current = owner;
    return () => {
      scope.current = null;
      abortRequests();
      current.current = null;
    };
  }, [abortRequests, owner]);

  const pause = useCallback(() => {
    if (scope.current !== owner) return;
    const before = readCurrent();
    const interrupted = writeRequest.current !== null;
    abortRequests();
    if (before?.status === 'ready')
      publish({
        ...before,
        access: 'checking',
        mutation: interrupted ? 'uncertain' : before.mutation,
        message: interrupted ? staffDraftUncertainMessage : before.message,
      });
  }, [abortRequests, owner, publish, readCurrent]);

  const load = useCallback(
    async (replace: boolean) => {
      if (scope.current !== owner || owner.token === null) return;
      pause();
      const before = readCurrent();
      if (before?.status === 'ready' && expired(before.draft)) {
        publish(unavailable());
        return;
      }
      const controller = new AbortController();
      readRequest.current = controller;
      const active = () =>
        scope.current === owner &&
        readRequest.current === controller &&
        !controller.signal.aborted;
      if (before?.status !== 'ready') publish({ status: 'loading' });
      try {
        const draft = await getStaffDraft(owner.token, controller.signal);
        if (!active()) return;
        if (expired(draft)) {
          publish(unavailable());
          return;
        }
        if (
          before?.status === 'ready' &&
          !sameStaffDraftIdentity(before.draft, draft)
        )
          throw new ApiRequestError(
            '작성 링크의 내용을 확인하지 못했습니다.',
            200,
            'INVALID_STAFF_DRAFT_RESPONSE',
          );
        const local = readCurrent();
        if (!replace && local?.status === 'ready' && hasLocalWork(local)) {
          const changed =
            draft.updatedAt !== local.draft.updatedAt ||
            !sameStaffDraftAnswers(draft.answers, local.draft.answers);
          publish({
            ...local,
            access: 'ready',
            mutation: changed ? 'conflict' : local.mutation,
            message: changed
              ? staffDraftChangedMessage
              : local.mutation === 'uncertain'
                ? staffDraftUncertainMessage
                : local.mutation === 'conflict'
                  ? staffDraftChangedMessage
                  : '',
          });
        } else
          publish({
            status: 'ready',
            draft,
            answers: draft.answers,
            access: 'ready',
            mutation: 'idle',
            message: '',
          });
      } catch (error: unknown) {
        if (!active()) return;
        if (rejected(error)) publish(unavailable());
        else if (
          error instanceof ApiRequestError &&
          error.code === 'UNSUPPORTED_STAFF_DRAFT'
        )
          publish({
            status: 'error',
            kind: 'unsupported',
            message: '이 화면은 직원의 정비 작성 전용입니다.',
          });
        else {
          const local = readCurrent();
          const message =
            error instanceof ApiRequestError && error.status === 429
              ? '요청이 많습니다. 잠시 후 연결을 다시 확인해 주세요.'
              : '저장 상태를 확인하지 못했습니다. 입력은 유지되지만 연결을 확인하기 전까지 변경할 수 없습니다.';
          publish(
            local?.status === 'ready'
              ? { ...local, access: 'blocked', message }
              : {
                  status: 'error',
                  kind: 'request',
                  message:
                    '정비 작성 내용을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.',
                },
          );
        }
      } finally {
        if (readRequest.current === controller) readRequest.current = null;
      }
    },
    [owner, pause, publish, readCurrent],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  const edit = useCallback(
    (change: (answers: StaffDraftAnswers) => StaffDraftAnswers) => {
      const local = readCurrent();
      if (
        scope.current !== owner ||
        local?.status !== 'ready' ||
        local.access !== 'ready' ||
        readRequest.current ||
        writeRequest.current ||
        needsReview(local)
      )
        return;
      if (expired(local.draft)) {
        abortRequests();
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
    [abortRequests, owner, publish, readCurrent],
  );

  const setAnswer = useCallback(
    (itemId: string, value: StaffDraftAnswer['value'] | null) => {
      edit((answers) => {
        if (
          requiresStaffAnswerDiscardConfirmation(answers, itemId, value) &&
          !window.confirm(
            '이 항목의 이상 내용, 긴급 표시 및 기존 수리 기록이 지워집니다. 변경할까요?',
          )
        )
          return answers;
        return changeStaffDraftAnswer(answers, itemId, value);
      });
    },
    [edit],
  );

  const save = useCallback(async () => {
    const local = readCurrent();
    if (
      scope.current !== owner ||
      !owner.token ||
      writeRequest.current ||
      readRequest.current ||
      local?.status !== 'ready' ||
      local.access !== 'ready' ||
      needsReview(local) ||
      sameStaffDraftAnswers(local.answers, local.draft.answers)
    )
      return;
    if (expired(local.draft)) {
      publish(unavailable());
      return;
    }
    const controller = new AbortController();
    writeRequest.current = controller;
    publish({ ...local, mutation: 'saving', message: '' });
    const active = () =>
      scope.current === owner &&
      writeRequest.current === controller &&
      !controller.signal.aborted;
    try {
      const draft = await saveStaffDraft(
        local.draft,
        local.answers,
        owner.token,
        controller.signal,
      );
      if (!active()) return;
      publish(
        expired(draft)
          ? unavailable()
          : {
              status: 'ready',
              draft,
              answers: draft.answers,
              access: 'ready',
              mutation: 'saved',
              message: '임시 저장했습니다. 아직 최종 제출되지 않았습니다.',
            },
      );
    } catch (error: unknown) {
      if (!active()) return;
      if (rejected(error)) publish(unavailable());
      else if (error instanceof ApiRequestError && error.status === 409)
        publish({
          ...local,
          mutation: 'conflict',
          message: staffDraftChangedMessage,
        });
      else if (unknownOutcome(error))
        publish({
          ...local,
          mutation: 'uncertain',
          message: staffDraftUncertainMessage,
        });
      else
        publish({
          ...local,
          mutation: 'error',
          message:
            error instanceof ApiRequestError
              ? error.message
              : '입력 내용을 확인한 뒤 다시 임시 저장해 주세요.',
        });
    } finally {
      if (writeRequest.current === controller) writeRequest.current = null;
    }
  }, [owner, publish, readCurrent]);

  const recheck = useCallback(() => {
    void load(false);
  }, [load]);
  const reload = useCallback(() => {
    if (scope.current !== owner || writeRequest.current) return;
    const local = readCurrent();
    if (
      local?.status === 'ready' &&
      hasLocalWork(local) &&
      !window.confirm(
        '현재 화면의 입력을 버리고 서버에 저장된 내용을 불러올까요? 불러온 내용을 확인한 뒤 다시 작성해 주세요.',
      )
    )
      return;
    void load(true);
  }, [load, owner, readCurrent]);
  const hasPendingWork = useCallback(() => {
    if (scope.current !== owner) return false;
    const local = readCurrent();
    return local?.status === 'ready' && hasLocalWork(local);
  }, [owner, readCurrent]);

  useEffect(() => {
    if (token === null) return;
    let wasAway = document.visibilityState === 'hidden';
    const leave = () => {
      wasAway = true;
    };
    const resume = () => {
      if (!wasAway || document.visibilityState === 'hidden') return;
      wasAway = false;
      recheck();
    };
    const visibility = () =>
      document.visibilityState === 'hidden' ? leave() : resume();
    const pageHidden = () => {
      leave();
      pause();
    };
    const restored = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      wasAway = false;
      recheck();
    };
    const warn = (event: BeforeUnloadEvent) => {
      const local = readCurrent();
      if (local?.status !== 'ready' || !hasLocalWork(local)) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('blur', leave);
    window.addEventListener('focus', resume);
    window.addEventListener('pagehide', pageHidden);
    window.addEventListener('pageshow', restored);
    window.addEventListener('beforeunload', warn);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('blur', leave);
      window.removeEventListener('focus', resume);
      window.removeEventListener('pagehide', pageHidden);
      window.removeEventListener('pageshow', restored);
      window.removeEventListener('beforeunload', warn);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [pause, readCurrent, recheck, token]);

  const resource: StaffDraftResource =
    result?.owner === owner ? result.resource : { status: 'loading' };
  const expiry = resource.status === 'ready' ? resource.draft.expiresAt : null;
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
          abortRequests();
          publish(unavailable());
        },
        Math.min(Math.max(0, Date.parse(expiry) - Date.now()), 2_147_483_647),
      );
    };
    schedule();
    return () => clearTimeout(timer);
  }, [abortRequests, expiry, owner, publish]);

  const dirty =
    resource.status === 'ready' &&
    !sameStaffDraftAnswers(resource.answers, resource.draft.answers);
  const busy =
    resource.status === 'ready' &&
    (resource.access === 'checking' || resource.mutation === 'saving');
  const canEdit =
    resource.status === 'ready' &&
    resource.access === 'ready' &&
    resource.mutation !== 'saving' &&
    !needsReview(resource);
  return {
    resource,
    dirty,
    busy,
    canEdit,
    canSave: canEdit && dirty,
    edit,
    setAnswer,
    save,
    reload,
    recheck,
    hasPendingWork,
  };
}
