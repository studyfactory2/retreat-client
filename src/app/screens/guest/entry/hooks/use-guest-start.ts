import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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

type StartStatus =
  'idle' | 'checking' | 'starting' | 'opening' | 'uncertain' | 'denied';

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
  const scope = useRef<typeof owner | null>(owner);
  const request = useRef<AbortController | null>(null);
  const issued = useRef<string | null>(null);
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
  const hasPendingWork = useCallback(() => {
    if (scope.current !== owner || !owner.type) return false;
    if (issued.current) {
      // A pending leave dialog may retain this form after successful creation.
      // Release only navigation to its verified draft; staying keeps it protected.
      return !(
        window.location.pathname === '/draft' &&
        window.location.search === '' &&
        window.location.hash === `#token=${issued.current}`
      );
    }
    const latest = stateRef.current;
    return (
      request.current !== null ||
      latest.status === 'checking' ||
      latest.status === 'starting' ||
      latest.status === 'uncertain' ||
      Object.keys(owner.initialState.fields).some(
        (key) =>
          latest.fields[key as keyof GuestStartFields] !==
          owner.initialState.fields[key as keyof GuestStartFields],
      )
    );
  }, [owner]);
  const dirty =
    type !== null &&
    (pending ||
      state.status === 'opening' ||
      state.status === 'uncertain' ||
      Object.keys(owner.initialState.fields).some(
        (key) =>
          state.fields[key as keyof GuestStartFields] !==
          owner.initialState.fields[key as keyof GuestStartFields],
      ));

  useLayoutEffect(() => {
    scope.current = owner;
    issued.current = null;
    return () => {
      scope.current = null;
      request.current?.abort();
      request.current = null;
    };
  }, [owner]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!hasPendingWork()) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasPendingWork]);

  function patch(update: Partial<StartState>) {
    if (scope.current !== owner) return;
    const next = { ...stateRef.current, ...update };
    stateRef.current = next;
    setResult({ owner, state: next });
  }

  function setField(field: keyof GuestStartFields, value: string) {
    if (
      issued.current !== null ||
      request.current ||
      stateRef.current.status === 'uncertain'
    )
      return;
    const errors = { ...stateRef.current.errors };
    delete errors[field];
    patch({
      fields: { ...stateRef.current.fields, [field]: value },
      errors,
      message: '',
    });
  }

  function openIssued() {
    if (scope.current !== owner || !issued.current) return;
    patch({
      status: 'opening',
      message:
        '체크리스트를 만들었습니다. 시설 확인을 계속해 주세요. 새 체크리스트는 만들지 않습니다.',
    });
    try {
      navigate(
        { pathname: '/draft', hash: `#token=${issued.current}` },
        { replace: true },
      );
    } catch {
      patch({
        message:
          '작성 화면을 열지 못했습니다. 아래 버튼으로 만든 체크리스트를 다시 열어 주세요.',
      });
    }
  }

  async function act(fresh: boolean) {
    if (
      !token ||
      !type ||
      !entry ||
      request.current ||
      issued.current !== null ||
      scope.current !== owner
    )
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
      // Keep the validated capability if a pending leave dialog retains this form.
      issued.current = saved.accessToken;
      openIssued();
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

  return {
    state,
    pending,
    dirty,
    hasPendingWork,
    openIssued,
    setField,
    start: () => act(false),
    prepareFresh: () => act(true),
  };
}
