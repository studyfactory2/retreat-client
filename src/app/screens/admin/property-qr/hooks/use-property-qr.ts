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
};
const idleMutation: Mutation = { busyFlow: null, blocked: false };

function reconcileReceipts(receipts: Receipts, qr: PropertyQrStatus): Receipts {
  if (!qr.propertyIsActive) return {};
  const retained: Receipts = {};
  for (const flow of ['GUEST', 'STAFF'] as const) {
    const issue = receipts[flow];
    const state = qr[qrFlowKey(flow)];
    if (issue && state.enabled && issue.rotatedAt === state.rotatedAt)
      retained[flow] = issue;
  }
  return retained;
}

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
  const locked = useRef(false);

  useLayoutEffect(() => {
    scope.current = { propertyId, token };
    return () => {
      scope.current = null;
      readRequest.current?.abort();
      writeRequest.current?.abort();
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
    const controller = new AbortController();
    readRequest.current = controller;
    const previous = current.current;
    const sameOwner =
      previous?.propertyId === propertyId && previous.owner === token;
    const receipts = sameOwner ? previous.receipts : {};
    const mutation = sameOwner ? previous.mutation : idleMutation;
    publish({
      propertyId,
      owner: token,
      resource: { status: 'loading' },
      receipts,
      mutation,
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
        receipts: reconcileReceipts(receipts, qrResult.value),
        mutation: idleMutation,
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
      readRequest.current = null;
      writeRequest.current = null;
    };
  }, [refresh]);

  async function rotate(flow: QrFlow, expectedRotatedAt: string | null) {
    const previous = current.current;
    if (
      !ownsScope() ||
      locked.current ||
      readRequest.current ||
      writeRequest.current ||
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
                rotatedAt: issue.rotatedAt,
              },
            },
          },
        },
        receipts: { ...previous.receipts, [flow]: issue },
        mutation: {
          busyFlow: null,
          blocked: false,
          tone: 'success',
          message: `${qrFlowLabels[flow]} QR을 발급했습니다. 이 화면을 떠나기 전에 주소나 QR 이미지를 보관해 주세요.`,
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

  const visible =
    state?.propertyId === propertyId && state.owner === token
      ? state
      : undefined;
  return {
    resource: visible?.resource ?? { status: 'loading' as const },
    mutation: visible?.mutation ?? idleMutation,
    receipts: visible?.receipts ?? {},
    refresh,
    rotate,
  };
}
