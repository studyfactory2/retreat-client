import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { getAdminProperty } from '../../../../features/admin-properties/admin-property-management-api';
import type { AdminPropertyDto } from '../../../../features/admin-properties/admin-property-management.types';
import {
  getAdminPropertyQr,
  getAdminPropertyQrLink,
  rotateAdminPropertyQr,
} from '../../../../features/admin-property-qr/admin-property-qr-api';
import type {
  PropertyQrStatus,
  QrFlow,
  QrIssue,
} from '../../../../features/admin-property-qr/admin-property-qr.types';
import {
  qrFlowKey,
  qrFlowLabels,
  qrMutationFailure,
} from '../model/property-qr-model';

type WorkspaceData = { property: AdminPropertyDto; qr: PropertyQrStatus };
type Resource =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: WorkspaceData };
type Mutation = {
  busyFlow: QrFlow | null;
  blocked: boolean;
  message?: string;
  tone?: 'success' | 'error';
};
type Receipts = Partial<Record<QrFlow, QrIssue>>;
type WorkspaceState = {
  propertyId: string;
  owner: string;
  resource: Resource;
  mutation: Mutation;
  receipts: Receipts;
  openingFlow: QrFlow | null;
};
const idleMutation: Mutation = { busyFlow: null, blocked: false };

export function usePropertyQr(
  propertyId: string,
  token: string,
  rejectSession: (token: string) => void,
) {
  const [state, setState] = useState<WorkspaceState>();
  const current = useRef<WorkspaceState | undefined>(undefined);
  const scope = useRef<{ propertyId: string; token: string } | null>({
    propertyId,
    token,
  });
  const readRequest = useRef<AbortController | null>(null);
  const writeRequest = useRef<AbortController | null>(null);
  const linkRequest = useRef<AbortController | null>(null);
  const locked = useRef(false);

  useLayoutEffect(() => {
    scope.current = { propertyId, token };
    return () => {
      scope.current = null;
      readRequest.current?.abort();
      writeRequest.current?.abort();
      linkRequest.current?.abort();
    };
  }, [propertyId, token]);

  const ownsScope = useCallback(
    () =>
      scope.current?.propertyId === propertyId && scope.current.token === token,
    [propertyId, token],
  );
  const publish = useCallback((next: WorkspaceState) => {
    current.current = next;
    setState(next);
  }, []);

  const refresh = useCallback(async () => {
    if (!ownsScope() || writeRequest.current) return;
    readRequest.current?.abort();
    linkRequest.current?.abort();
    linkRequest.current = null;
    const controller = new AbortController();
    readRequest.current = controller;
    const previous = current.current;
    const sameOwner =
      previous?.propertyId === propertyId && previous.owner === token;
    const receipts: Receipts = {};
    const mutation = sameOwner ? previous.mutation : idleMutation;
    publish({
      propertyId,
      owner: token,
      resource: { status: 'loading' },
      receipts,
      mutation,
      openingFlow: null,
    });
    try {
      const results = await Promise.allSettled([
        getAdminProperty(propertyId, token, controller.signal),
        getAdminPropertyQr(propertyId, token, controller.signal),
      ]);
      if (
        controller.signal.aborted ||
        !ownsScope() ||
        readRequest.current !== controller
      )
        return;
      const denied = results.some(
        (result) =>
          result.status === 'rejected' &&
          result.reason instanceof ApiRequestError &&
          (result.reason.status === 401 || result.reason.status === 403),
      );
      if (denied) {
        locked.current = true;
        rejectSession(token);
        return;
      }
      const [propertyResult, qrResult] = results;
      if (propertyResult.status === 'rejected') throw propertyResult.reason;
      if (qrResult.status === 'rejected') throw qrResult.reason;
      locked.current = false;
      publish({
        propertyId,
        owner: token,
        resource: {
          status: 'ready',
          data: { property: propertyResult.value, qr: qrResult.value },
        },
        receipts,
        mutation: idleMutation,
        openingFlow: null,
      });
    } catch {
      if (
        controller.signal.aborted ||
        !ownsScope() ||
        readRequest.current !== controller
      )
        return;
      publish({
        propertyId,
        owner: token,
        resource: {
          status: 'error',
          message:
            '휴양소와 QR 발급 상태를 확인하지 못했습니다. 다시 불러와 주세요.',
        },
        receipts,
        mutation,
        openingFlow: null,
      });
    } finally {
      if (readRequest.current === controller) readRequest.current = null;
    }
  }, [propertyId, token, ownsScope, publish, rejectSession]);

  useEffect(() => {
    locked.current = false;
    void refresh();
    return () => {
      readRequest.current?.abort();
      writeRequest.current?.abort();
      linkRequest.current?.abort();
      readRequest.current = null;
      writeRequest.current = null;
      linkRequest.current = null;
    };
  }, [refresh]);

  async function rotate(flow: QrFlow, expectedRotatedAt: string | null) {
    const previous = current.current;
    if (
      !ownsScope() ||
      locked.current ||
      readRequest.current ||
      writeRequest.current ||
      linkRequest.current ||
      previous?.propertyId !== propertyId ||
      previous.owner !== token ||
      previous.resource.status !== 'ready' ||
      !previous.resource.data.qr.propertyIsActive ||
      previous.resource.data.qr[qrFlowKey(flow)].rotatedAt !== expectedRotatedAt
    )
      return;
    const controller = new AbortController();
    writeRequest.current = controller;
    publish({ ...previous, mutation: { busyFlow: flow, blocked: false } });
    try {
      const issue = await rotateAdminPropertyQr(
        propertyId,
        flow,
        expectedRotatedAt,
        token,
        controller.signal,
      );
      if (
        controller.signal.aborted ||
        !ownsScope() ||
        writeRequest.current !== controller
      )
        return;
      const data = previous.resource.data;
      publish({
        ...previous,
        resource: {
          status: 'ready',
          data: {
            ...data,
            qr: {
              ...data.qr,
              [qrFlowKey(flow)]: {
                issued: true,
                enabled: true,
                canReopen: issue.canReopen,
                rotatedAt: issue.rotatedAt,
              },
            },
          },
        },
        receipts: { [flow]: issue },
        mutation: {
          busyFlow: null,
          blocked: false,
          tone: 'success',
          message: issue.canReopen
            ? `${qrFlowLabels[flow]} QR을 발급했습니다. 다음에도 QR 열기로 다시 확인할 수 있습니다.`
            : `${qrFlowLabels[flow]} QR을 발급했습니다. 이 주소는 다시 열 수 없으니 지금 복사하거나 QR을 저장해 주세요.`,
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
        rejectSession(token);
        return;
      }
      const failure = qrMutationFailure(error);
      locked.current = failure.blocked;
      const receipts = { ...previous.receipts };
      // A competing or uncertain write may have replaced this exact credential.
      if (failure.blocked) delete receipts[flow];
      publish({
        ...previous,
        receipts,
        mutation: { busyFlow: null, tone: 'error', ...failure },
      });
    } finally {
      if (writeRequest.current === controller) writeRequest.current = null;
    }
  }

  function closePreview() {
    linkRequest.current?.abort();
    linkRequest.current = null;
    const previous = current.current;
    if (ownsScope() && previous && previous.owner === token)
      publish({ ...previous, receipts: {}, openingFlow: null });
  }

  async function reopen(flow: QrFlow) {
    const previous = current.current;
    if (
      !ownsScope() ||
      locked.current ||
      readRequest.current ||
      writeRequest.current ||
      linkRequest.current ||
      previous?.propertyId !== propertyId ||
      previous.owner !== token ||
      previous.resource.status !== 'ready'
    )
      return;
    const qrState = previous.resource.data.qr[qrFlowKey(flow)];
    if (!qrState.enabled || !qrState.canReopen || !qrState.rotatedAt) return;
    const controller = new AbortController();
    linkRequest.current = controller;
    publish({
      ...previous,
      receipts: {},
      openingFlow: flow,
      mutation: idleMutation,
    });
    try {
      const issue = await getAdminPropertyQrLink(
        propertyId,
        flow,
        qrState.rotatedAt,
        token,
        controller.signal,
      );
      if (
        controller.signal.aborted ||
        !ownsScope() ||
        linkRequest.current !== controller
      )
        return;
      publish({
        ...previous,
        receipts: { [flow]: issue },
        openingFlow: null,
        mutation: idleMutation,
      });
    } catch (error: unknown) {
      if (
        controller.signal.aborted ||
        !ownsScope() ||
        linkRequest.current !== controller
      )
        return;
      if (
        error instanceof ApiRequestError &&
        (error.status === 401 || error.status === 403)
      ) {
        publish({ ...previous, receipts: {}, openingFlow: null });
        locked.current = true;
        rejectSession(token);
        return;
      }
      publish({
        ...previous,
        receipts: {},
        openingFlow: null,
        mutation: {
          busyFlow: null,
          blocked: false,
          tone: 'error',
          message:
            'QR을 열지 못했습니다. 최신 상태를 확인한 뒤 다시 열어 주세요. 기존 QR은 자동으로 교체되지 않습니다.',
        },
      });
    } finally {
      if (linkRequest.current === controller) linkRequest.current = null;
    }
  }

  const visible =
    state?.propertyId === propertyId && state.owner === token
      ? state
      : undefined;
  return {
    resource: visible?.resource ?? { status: 'loading' as const },
    mutation: visible?.mutation ?? idleMutation,
    receipts: visible?.receipts ?? {},
    openingFlow: visible?.openingFlow ?? null,
    closePreview,
    reopen,
    refresh,
    rotate,
    isBusy: () => ownsScope() && writeRequest.current !== null,
    hasOneTimeReceipt: () => {
      const latest = current.current;
      return Boolean(
        ownsScope() &&
        latest?.propertyId === propertyId &&
        latest.owner === token &&
        Object.values(latest.receipts).some((issue) => !issue.canReopen),
      );
    },
    hasPendingChanges: () => {
      const latest = current.current;
      return Boolean(
        ownsScope() &&
        (writeRequest.current !== null ||
          (latest?.propertyId === propertyId &&
            latest.owner === token &&
            (latest.mutation.blocked ||
              Object.values(latest.receipts).some(
                (issue) => !issue.canReopen,
              )))),
      );
    },
  };
}
