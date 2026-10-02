import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { getGuestDraft, saveGuestDraft } from '../../../../features/guest-drafts/guest-drafts-api';
import type { GuestDraftAnswers, GuestDraftDto } from '../../../../features/guest-drafts/guest-drafts.types';
import { draftChangedMessage, draftUncertainMessage, sameDraftAnswers } from '../model/guest-draft-model';

export type DraftResource =
  | { status: 'loading' }
  | { status: 'error'; kind: 'unavailable' | 'unsupported' | 'request'; message: string }
  | {
      status: 'ready'; draft: GuestDraftDto; answers: GuestDraftAnswers;
      access: 'ready' | 'checking' | 'blocked';
      mutation: 'idle' | 'saving' | 'saved' | 'error' | 'conflict' | 'uncertain';
      message: string;
    };

function unavailable(): DraftResource {
  return { status: 'error', kind: 'unavailable', message: '이 작성 링크를 사용할 수 없습니다. 전달받은 링크를 확인하거나 관리자에게 문의해 주세요.' };
}

function isExpired(draft: GuestDraftDto): boolean {
  return Date.parse(draft.expiresAt) <= Date.now();
}

function needsReview(resource: Extract<DraftResource, { status: 'ready' }>): boolean {
  return resource.mutation === 'uncertain' || resource.mutation === 'conflict';
}

export function useGuestDraft(token: string | null) {
  // The credential owns this mounted session; it is never a serialized key.
  const owner = useMemo(() => ({ token }), [token]);
  const scope = useRef<typeof owner | null>(owner);
  const readRequest = useRef<AbortController | null>(null);
  const writeRequest = useRef<AbortController | null>(null);
  const queuedCheck = useRef(false);
  const current = useRef<{ owner: typeof owner; resource: DraftResource } | null>(null);
  const [result, setResult] = useState<typeof current.current>(null);
  const publish = useCallback((resource: DraftResource) => {
    if (scope.current !== owner) return;
    const next = { owner, resource };
    current.current = next;
    setResult(next);
  }, [owner]);
  const readCurrent = useCallback((): DraftResource | null =>
    current.current?.owner === owner ? current.current.resource : null, [owner]);

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

  const load = useCallback(async (replace: boolean) => {
    if (scope.current !== owner || owner.token === null) return;
    if (writeRequest.current) {
      queuedCheck.current = true;
      return;
    }
    readRequest.current?.abort();
    const controller = new AbortController();
    readRequest.current = controller;
    const active = () => scope.current === owner && readRequest.current === controller && !controller.signal.aborted;
    const before = readCurrent();
    publish(before?.status === 'ready' ? { ...before, access: 'checking' } : { status: 'loading' });
    try {
      const draft = await getGuestDraft(owner.token, controller.signal);
      if (!active()) return;
      if (isExpired(draft)) { publish(unavailable()); return; }
      const local = readCurrent();
      if (!replace && local?.status === 'ready' && (
        !sameDraftAnswers(local.answers, local.draft.answers) || needsReview(local)
      )) {
        if (draft.id !== local.draft.id || draft.updatedAt !== local.draft.updatedAt) {
          publish({ ...local, access: 'ready', mutation: 'conflict', message: draftChangedMessage });
        } else publish({ ...local, access: 'ready', message: local.mutation === 'uncertain'
          ? draftUncertainMessage : local.mutation === 'conflict' ? draftChangedMessage : '' });
      } else publish({ status: 'ready', draft, answers: draft.answers, access: 'ready', mutation: 'idle', message: '' });
    } catch (error: unknown) {
      if (!active()) return;
      if (error instanceof ApiRequestError && (error.status === 401 || error.status === 403)) {
        publish(unavailable());
      } else if (error instanceof ApiRequestError && error.code === 'UNSUPPORTED_GUEST_DRAFT') {
        publish({ status: 'error', kind: 'unsupported', message: '이 화면은 이용객의 입실·퇴실 체크 전용입니다. 정비 작성은 직원용 안내를 이용해 주세요.' });
      } else {
        const message = error instanceof ApiRequestError && error.status === 429
          ? '요청이 많습니다. 잠시 후 연결을 다시 확인해 주세요.'
          : '저장 내용을 확인하지 못했습니다. 입력은 유지되지만 연결을 확인하기 전까지 저장할 수 없습니다.';
        const local = readCurrent();
        publish(local?.status === 'ready' ? { ...local, access: 'blocked', message }
          : { status: 'error', kind: 'request', message: '작성 내용을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.' });
      }
    } finally {
      if (readRequest.current === controller) readRequest.current = null;
    }
  }, [owner, publish, readCurrent]);

  useEffect(() => { void load(false); }, [load]);

  const edit = useCallback((change: (answers: GuestDraftAnswers) => GuestDraftAnswers) => {
    const local = readCurrent();
    if (scope.current !== owner || local?.status !== 'ready' || local.access === 'checking' || local.mutation === 'saving' || needsReview(local)) return;
    if (isExpired(local.draft)) { publish(unavailable()); return; }
    publish({ ...local, answers: change(local.answers), mutation: 'idle', message: local.access === 'blocked' ? local.message : '' });
  }, [owner, publish, readCurrent]);

  const save = useCallback(async () => {
    const local = readCurrent();
    if (scope.current !== owner || !owner.token || writeRequest.current || readRequest.current ||
      local?.status !== 'ready' || local.access !== 'ready' || needsReview(local) ||
      sameDraftAnswers(local.answers, local.draft.answers)) return;
    if (isExpired(local.draft)) { publish(unavailable()); return; }
    const controller = new AbortController();
    writeRequest.current = controller;
    publish({ ...local, mutation: 'saving', message: '' });
    const active = () => scope.current === owner && writeRequest.current === controller && !controller.signal.aborted;
    try {
      const draft = await saveGuestDraft(local.draft, local.answers, owner.token, controller.signal);
      if (!active()) return;
      publish(isExpired(draft) ? unavailable()
        : { status: 'ready', draft, answers: draft.answers, access: 'ready', mutation: 'saved', message: '임시 저장했습니다. 아직 최종 제출되지 않았습니다.' });
    } catch (error: unknown) {
      if (!active()) return;
      if (error instanceof ApiRequestError && (error.status === 401 || error.status === 403)) {
        publish(unavailable());
      } else if (error instanceof ApiRequestError && (error.code === 'DRAFT_CHANGED' || error.status === 409)) {
        publish({ ...local, mutation: 'conflict', message: draftChangedMessage });
      } else if (!(error instanceof ApiRequestError) || error.status === null || error.status < 400 || error.status >= 500 || error.status === 408) {
        publish({ ...local, mutation: 'uncertain', message: draftUncertainMessage });
      } else {
        publish({ ...local, mutation: 'error', message: error.message });
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
  }, [owner, publish, readCurrent, load]);

  const reload = useCallback(() => {
    const local = readCurrent();
    if (writeRequest.current || scope.current !== owner) return;
    if (local?.status === 'ready' && (!sameDraftAnswers(local.answers, local.draft.answers) || needsReview(local)) &&
      !window.confirm('현재 화면의 입력을 버리고 서버에 저장된 내용을 불러올까요? 불러온 내용을 확인한 뒤 다시 작성해 주세요.')) return;
    void load(true);
  }, [load, owner, readCurrent]);

  useEffect(() => {
    if (token === null) return;
    let wasAway = document.visibilityState === 'hidden';
    const leave = () => { wasAway = true; };
    const resume = () => {
      if (!wasAway || document.visibilityState === 'hidden') return;
      wasAway = false;
      void load(false);
    };
    const visibility = () => document.visibilityState === 'hidden' ? leave() : resume();
    const restored = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      wasAway = false;
      const local = readCurrent();
      if (writeRequest.current) {
        writeRequest.current.abort();
        writeRequest.current = null;
        if (local?.status === 'ready') publish({ ...local, mutation: 'uncertain', message: draftUncertainMessage });
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

  const resource: DraftResource = result?.owner === owner ? result.resource : { status: 'loading' };
  const expiry = resource.status === 'ready' ? resource.draft.expiresAt : null;
  useEffect(() => {
    if (!expiry) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        if (scope.current !== owner) return;
        if (Date.parse(expiry) > Date.now()) { schedule(); return; }
        readRequest.current?.abort();
        writeRequest.current?.abort();
        readRequest.current = null;
        writeRequest.current = null;
        publish(unavailable());
      }, Math.min(Math.max(0, Date.parse(expiry) - Date.now()), 2_147_483_647));
    };
    schedule();
    return () => clearTimeout(timer);
  }, [expiry, owner, publish]);

  const dirty = resource.status === 'ready' && !sameDraftAnswers(resource.answers, resource.draft.answers);
  const saving = resource.status === 'ready' && resource.mutation === 'saving';
  useEffect(() => {
    if (!dirty && !saving) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, saving]);

  return { resource, dirty, edit, save, reload, recheck: () => { void load(false); } };
}
