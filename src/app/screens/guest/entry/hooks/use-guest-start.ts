import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiRequestError } from '../../../../core/api/api-error';
import { startGuestDraft } from '../../../../features/guest-drafts/guest-drafts-api';
import type { GuestDraftType } from '../../../../features/guest-drafts/guest-drafts.types';
import { getGuestEntryContext } from '../../../../features/guest-entry/guest-entry-api';
import type {
  GuestAccessKind,
  GuestEntryContext,
} from '../../../../features/guest-entry/guest-entry.types';
import {
  createGuestStartFields,
  sameGuestStartContext,
  validateGuestStartFields,
  type GuestStartErrors,
  type GuestStartFields,
} from '../model/guest-start-model';

type StartStatus = 'idle' | 'checking' | 'starting' | 'uncertain' | 'denied';

type StartState = {
  fields: GuestStartFields;
  errors: GuestStartErrors;
  status: StartStatus;
  message: string;
};

export function useGuestStart(
  kind: GuestAccessKind,
  token: string | null,
  type: GuestDraftType | null,
  entry: GuestEntryContext | null,
  refresh: () => void,
) {
  const navigate = useNavigate();
  const owner = useMemo(
    () => ({
      kind,
      token,
      type,
      initialState: {
        fields: createGuestStartFields(),
        errors: {},
        status: 'idle' as const,
        message: '',
      },
    }),
    [kind, token, type],
  );
  const baseline = owner.initialState.fields;
  const scope = useRef<typeof owner | null>(owner);
  const request = useRef<AbortController | null>(null);
  const attempt = useRef<{ owner: typeof owner; requestKey: string } | null>(
    null,
  );
  const [result, setResult] = useState<{
    owner: typeof owner;
    state: StartState;
  }>();
  const state: StartState =
    result?.owner === owner ? result.state : owner.initialState;
  const stateRef = useRef(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  }, [state]);
  const pending = state.status === 'checking' || state.status === 'starting';
  const dirty =
    type !== null &&
    (pending ||
      state.status === 'uncertain' ||
      Object.keys(baseline).some(
        (key) =>
          state.fields[key as keyof GuestStartFields] !==
          baseline[key as keyof GuestStartFields],
      ));

  useLayoutEffect(() => {
    scope.current = owner;
    return () => {
      scope.current = null;
      request.current?.abort();
      request.current = null;
    };
  }, [owner]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function patch(update: Partial<StartState>) {
    if (scope.current !== owner) return;
    const next = { ...stateRef.current, ...update };
    stateRef.current = next;
    setResult({ owner, state: next });
  }

  function setField(field: keyof GuestStartFields, value: string) {
    if (request.current || stateRef.current.status === 'uncertain') return;
    const errors = { ...stateRef.current.errors };
    delete errors[field];
    patch({
      fields: { ...stateRef.current.fields, [field]: value },
      errors,
      message: '',
    });
  }

  async function act(fresh: boolean) {
    if (!token || !type || !entry || request.current || scope.current !== owner)
      return;
    if (
      !fresh &&
      (stateRef.current.status === 'uncertain' ||
        stateRef.current.status === 'denied')
    )
      return;
    if (fresh && stateRef.current.status !== 'uncertain') return;
    if (
      fresh &&
      !window.confirm(
        '이전에 시작한 체크리스트가 남아 있을 수 있습니다. 별도의 새 체크리스트를 준비할까요?',
      )
    )
      return;
    const fields = { ...stateRef.current.fields };
    const errors = kind === 'qr' ? validateGuestStartFields(fields) : {};
    if (Object.keys(errors).length) {
      patch({ errors, message: '입력한 내용을 확인해 주세요.' });
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    const current = () =>
      scope.current === owner &&
      request.current === controller &&
      !controller.signal.aborted;
    let submitted = false;
    patch({ status: 'checking', errors: {}, message: '' });
    try {
      // Re-read access before a deliberate mutation; a restored tab may hold stale context.
      const latest = await getGuestEntryContext(kind, token, controller.signal);
      if (!current()) return;
      if (
        latest.kind === 'stay' &&
        Date.parse(latest.context.expiresAt) <= Date.now()
      ) {
        patch({
          status: 'denied',
          message:
            '이용 링크를 사용할 수 없습니다. 관리자에게 새 링크를 요청해 주세요.',
        });
        return;
      }
      if (fresh) {
        attempt.current = { owner, requestKey: crypto.randomUUID() };
        patch({
          status: 'idle',
          message:
            '새 체크리스트를 준비했습니다. 아래 시작 버튼을 눌러 주세요.',
        });
        refresh();
        return;
      }
      if (!sameGuestStartContext(entry, latest, type)) {
        patch({
          status: 'idle',
          message:
            '이용 정보가 변경되었습니다. 새로 불러온 내용을 확인한 뒤 시작해 주세요.',
        });
        refresh();
        return;
      }
      if (!attempt.current || attempt.current.owner !== owner) {
        attempt.current = { owner, requestKey: crypto.randomUUID() };
      }
      const input = {
        requestKey: attempt.current.requestKey,
        type,
        ...(kind === 'qr' ? fields : {}),
      };
      patch({ status: 'starting' });
      submitted = true;
      const saved = await startGuestDraft(
        latest,
        input,
        token,
        controller.signal,
      );
      if (!current()) return;
      // The receipt has already validated the public origin, draft path and matching token.
      navigate(
        { pathname: '/draft', hash: `#token=${saved.accessToken}` },
        { replace: true },
      );
    } catch (error: unknown) {
      if (!current()) return;
      const failure = error instanceof ApiRequestError ? error : null;
      const unknownOutcome =
        submitted &&
        (failure === null ||
          failure.status === null ||
          (failure.status !== null && failure.status < 400) ||
          failure.status === 408 ||
          (failure.status !== null && failure.status >= 500) ||
          failure.code === 'DRAFT_REQUEST_EXISTS');
      if (unknownOutcome) {
        patch({
          status: 'uncertain',
          message:
            '시작 결과를 확인하지 못했습니다. 서버에 체크리스트가 만들어졌을 수 있지만, 이어쓰기 링크는 받지 못했습니다.',
        });
      } else if (failure?.status === 401 || failure?.status === 403) {
        patch({
          status: 'denied',
          message: '이용 링크를 사용할 수 없습니다. 관리자에게 문의해 주세요.',
        });
      } else {
        patch({
          status: fresh ? 'uncertain' : 'idle',
          message:
            failure?.status === 429
              ? '요청이 많습니다. 잠시 후 다시 시도해 주세요.'
              : failure?.code === 'CHECKLIST_UNAVAILABLE'
                ? '현재 사용할 수 있는 체크리스트가 없습니다. 관리자에게 문의해 주세요.'
                : failure?.status === 400
                  ? failure.message
                  : '이용 정보를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.',
        });
      }
    } finally {
      if (request.current === controller) request.current = null;
    }
  }

  function confirmLeave() {
    if (!dirty) return true;
    return window.confirm(
      pending
        ? '시작 결과를 확인 중입니다. 지금 나가면 이어쓰기 링크를 받지 못할 수 있습니다. 나갈까요?'
        : state.status === 'uncertain'
          ? '체크리스트 시작 결과를 아직 확인하지 못했습니다. 이 화면에서 나갈까요?'
          : '입력한 이용객 정보가 저장되지 않았습니다. 나갈까요?',
    );
  }

  return {
    state,
    pending,
    dirty,
    setField,
    start: () => act(false),
    prepareFresh: () => act(true),
    confirmLeave,
  };
}
