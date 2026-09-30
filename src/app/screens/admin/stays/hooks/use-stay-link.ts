import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import {
  getAdminStayLink,
  issueAdminStayLink,
  revokeAdminStayLink,
} from '../../../../features/admin-stay-links/admin-stay-link-api';
import type {
  AdminStayLinkIssue,
  AdminStayLinkStatus,
  StayLinkAction,
} from '../../../../features/admin-stay-links/admin-stay-link.types';
import { getAdminStay } from '../../../../features/admin-stays/admin-stays-api';
import type { AdminStayDto } from '../../../../features/admin-stays/admin-stays.types';
import {
  canIssueStayLink,
  canRevokeStayLink,
  getStayLinkDeadline,
  sameStayLinkStatus,
  stayLinkMutationFailure,
} from '../model/stay-link-model';

type Resource =
  | { status: 'loading' }
  | { status: 'error'; message: string; needsStayRefresh?: boolean }
  | { status: 'ready'; data: AdminStayLinkStatus };
type Mutation = {
  busy: boolean;
  blocked: boolean;
  message?: string;
  tone?: 'success' | 'error';
};
type Workspace = {
  key: string;
  owner: string;
  resource: Resource;
  mutation: Mutation;
  receipt: AdminStayLinkIssue | null;
};
const idleMutation: Mutation = { busy: false, blocked: false };

function stayScope(stay: AdminStayDto): string {
  return JSON.stringify([
    stay.id,
    stay.currentRevision,
    stay.status,
    stay.propertyId,
    stay.property.id,
    stay.property.isActive,
    stay.checkOutAt,
  ]);
}

function retainReceipt(
  receipt: AdminStayLinkIssue | null,
  status: AdminStayLinkStatus,
): AdminStayLinkIssue | null {
  return receipt &&
    status.enabled &&
    status.expiresAt &&
    Date.parse(status.expiresAt) > Date.now() &&
    sameStayLinkStatus(receipt, status)
    ? receipt
    : null;
}

function expiresLocally(status: AdminStayLinkStatus): AdminStayLinkStatus {
  // Project safe status fields: an issue response also contains its one-time URL.
  return {
    stayId: status.stayId,
    issued: status.issued,
    enabled: Boolean(
      status.enabled && status.expiresAt && Date.parse(status.expiresAt) > Date.now(),
    ),
    version: status.version,
    stayRevision: status.stayRevision,
    issuedForRevision: status.issuedForRevision,
    expiresAt: status.expiresAt,
    updatedAt: status.updatedAt,
  };
}

export function useStayLink(
  stay: AdminStayDto,
  token: string,
  rejectSession: (token: string) => void,
) {
  const key = stayScope(stay);
  const [state, setState] = useState<Workspace>();
  const current = useRef<Workspace | undefined>(undefined);
  const scope = useRef<{ key: string; token: string } | null>({ key, token });
  const readRequest = useRef<AbortController | null>(null);
  const writeRequest = useRef<AbortController | null>(null);
  const locked = useRef(false);

  useLayoutEffect(() => {
    scope.current = { key, token };
    return () => {
      scope.current = null;
      readRequest.current?.abort();
      writeRequest.current?.abort();
    };
  }, [key, token]);

  const ownsScope = useCallback(
    () => scope.current?.key === key && scope.current.token === token,
    [key, token],
  );
  const publish = useCallback((next: Workspace) => {
    current.current = next;
    setState(next);
  }, []);

  const refresh = useCallback(async () => {
    if (!ownsScope() || writeRequest.current) return;
    readRequest.current?.abort();
    const controller = new AbortController();
    readRequest.current = controller;
    const previous = current.current;
    const sameOwner = previous?.key === key && previous.owner === token;
    const receipt = sameOwner ? previous.receipt : null;
    publish({
      key,
      owner: token,
      resource: { status: 'loading' },
      mutation: sameOwner ? previous.mutation : idleMutation,
      receipt,
    });
    try {
      const results = await Promise.allSettled([
        getAdminStay(stay.id, token, controller.signal),
        getAdminStayLink(stay.id, token, controller.signal),
      ]);
      if (
        controller.signal.aborted ||
        !ownsScope() ||
        readRequest.current !== controller
      )
        return;
      if (
        results.some(
          (result) =>
            result.status === 'rejected' &&
            result.reason instanceof ApiRequestError &&
            (result.reason.status === 401 || result.reason.status === 403),
        )
      ) {
        locked.current = true;
        publish({
          key,
          owner: token,
          resource: { status: 'error', message: '다시 로그인해 주세요.' },
          mutation: { busy: false, blocked: true },
          receipt: null,
        });
        rejectSession(token);
        return;
      }
      const [stayResult, linkResult] = results;
      if (stayResult.status === 'rejected') throw stayResult.reason;
      if (linkResult.status === 'rejected') throw linkResult.reason;
      if (
        stayScope(stayResult.value) !== key ||
        linkResult.value.stayRevision !== stay.currentRevision
      ) {
        locked.current = true;
        publish({
          key,
          owner: token,
          resource: {
            status: 'error',
            message: '이용 일정이 변경되었습니다. 일정 전체를 새로고침한 뒤 개인 이용 링크를 확인해 주세요.',
            needsStayRefresh: true,
          },
          mutation: { busy: false, blocked: true },
          receipt: null,
        });
        return;
      }
      const status = expiresLocally(linkResult.value);
      locked.current = false;
      publish({
        key,
        owner: token,
        resource: { status: 'ready', data: status },
        mutation: idleMutation,
        receipt: retainReceipt(receipt, status),
      });
    } catch (error: unknown) {
      if (
        controller.signal.aborted ||
        !ownsScope() ||
        readRequest.current !== controller
      )
        return;
      locked.current = true;
      publish({
        key,
        owner: token,
        resource: {
          status: 'error',
          message: '이용 일정과 개인 이용 링크 상태를 확인하지 못했습니다. 다시 불러와 주세요.',
        },
        mutation: { busy: false, blocked: true },
        // A failed GET cannot prove the invitation changed. Keep its one-time
        // URL private until a successful refresh verifies the same invitation.
        receipt:
          !(error instanceof ApiRequestError && error.status === 404) &&
          receipt?.expiresAt &&
          Date.parse(receipt.expiresAt) > Date.now()
            ? receipt
            : null,
      });
    } finally {
      if (readRequest.current === controller) readRequest.current = null;
    }
  }, [key, stay.id, stay.currentRevision, token, ownsScope, publish, rejectSession]);

  useEffect(() => {
    locked.current = false;
    void refresh();
    return () => {
      readRequest.current?.abort();
      writeRequest.current?.abort();
      readRequest.current = null;
      writeRequest.current = null;
    };
  }, [refresh]);

  const expiry =
    state?.resource.status === 'ready' ? state.resource.data.expiresAt : null;
  const receiptExpiry = state?.receipt?.expiresAt;
  const deadline = getStayLinkDeadline(stay);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    function expire() {
      const previous = current.current;
      if (!ownsScope() || previous?.key !== key || previous.owner !== token)
        return;
      const resource = previous.resource;
      const nextStatus =
        resource.status === 'ready' ? expiresLocally(resource.data) : null;
      publish({
        ...previous,
        resource: nextStatus ? { status: 'ready', data: nextStatus } : resource,
        receipt:
          previous.receipt?.expiresAt &&
          Date.parse(previous.receipt.expiresAt) > Date.now()
            ? previous.receipt
            : null,
      });
    }
    function schedule() {
      clearTimeout(timer);
      const future = [deadline, Date.parse(expiry ?? ''), Date.parse(receiptExpiry ?? '')]
        .filter((value) => Number.isFinite(value) && value > Date.now());
      if (!future.length) return;
      timer = setTimeout(() => {
        expire();
        schedule();
      }, Math.min(Math.max(1, Math.min(...future) - Date.now()), 2_147_483_647));
    }
    function checkAfterFocus() {
      expire();
      schedule();
    }
    if (
      deadline <= Date.now() ||
      (expiry && Date.parse(expiry) <= Date.now()) ||
      (receiptExpiry && Date.parse(receiptExpiry) <= Date.now())
    )
      expire();
    schedule();
    window.addEventListener('focus', checkAfterFocus);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', checkAfterFocus);
    };
  }, [deadline, expiry, receiptExpiry, key, token, ownsScope, publish]);

  async function mutate(action: StayLinkAction, confirmed: AdminStayLinkStatus) {
    const previous = current.current;
    if (
      !ownsScope() ||
      locked.current ||
      readRequest.current ||
      writeRequest.current ||
      previous?.key !== key ||
      previous.owner !== token ||
      previous.resource.status !== 'ready'
    )
      return;
    const status = previous.resource.data;
    if (!sameStayLinkStatus(status, confirmed)) return;
    if (
      action === 'issue'
        ? !canIssueStayLink(stay, status)
        : !canRevokeStayLink(status)
    )
      return;
    const controller = new AbortController();
    writeRequest.current = controller;
    publish({ ...previous, mutation: { busy: true, blocked: false } });
    try {
      let issue: AdminStayLinkIssue | null = null;
      let result: AdminStayLinkStatus;
      if (action === 'issue') {
        issue = await issueAdminStayLink(stay.id, status, stay.checkOutAt, token, controller.signal);
        result = issue;
      } else {
        result = await revokeAdminStayLink(stay.id, status, token, controller.signal);
      }
      if (
        controller.signal.aborted ||
        !ownsScope() ||
        writeRequest.current !== controller
      )
        return;
      const nextStatus = expiresLocally(result);
      publish({
        ...previous,
        resource: { status: 'ready', data: nextStatus },
        receipt: retainReceipt(issue, nextStatus),
        mutation: {
          busy: false,
          blocked: false,
          tone: 'success',
          message:
            action === 'issue'
              ? '개인 이용 링크를 발급했습니다. 이 화면을 떠나기 전에 주소를 복사해 보관해 주세요.'
              : '개인 이용 링크를 폐기했습니다. 이전 링크와 연결된 작성 중 접근은 사용할 수 없습니다.',
        },
      });
    } catch (error: unknown) {
      if (
        controller.signal.aborted ||
        !ownsScope() ||
        writeRequest.current !== controller
      )
        return;
      if (
        error instanceof ApiRequestError &&
        (error.status === 401 || error.status === 403)
      ) {
        locked.current = true;
        publish({
          ...previous,
          receipt: null,
          mutation: { busy: false, blocked: true, tone: 'error', message: '다시 로그인해 주세요.' },
        });
        rejectSession(token);
        return;
      }
      const failure = stayLinkMutationFailure(error, action);
      locked.current = failure.blocked;
      const nextStatus = expiresLocally(status);
      publish({
        ...previous,
        resource: { status: 'ready', data: nextStatus },
        receipt: failure.blocked ? null : retainReceipt(previous.receipt, nextStatus),
        mutation: { busy: false, tone: 'error', ...failure },
      });
    } finally {
      if (writeRequest.current === controller) writeRequest.current = null;
    }
  }

  const visible = state?.key === key && state.owner === token ? state : undefined;
  return {
    resource: visible?.resource ?? { status: 'loading' as const },
    mutation: visible?.mutation ?? idleMutation,
    receipt:
      visible?.resource.status === 'ready' && !visible.mutation.busy
        ? retainReceipt(visible.receipt, visible.resource.data)
        : null,
    refresh,
    mutate,
    isBusy: () => ownsScope() && writeRequest.current !== null,
    hasReceipt: () => {
      const latest = current.current;
      return Boolean(
        ownsScope() &&
        latest?.key === key &&
        latest.owner === token &&
        latest.receipt?.expiresAt &&
        Date.parse(latest.receipt.expiresAt) > Date.now(),
      );
    },
  };
}
