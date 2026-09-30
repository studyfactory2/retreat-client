import { ApiRequestError } from '../../../../core/api/api-error';
import type {
  QrFlow,
  QrState,
} from '../../../../features/admin-property-qr/admin-property-qr.types';

export const qrFlowLabels: Record<QrFlow, string> = {
  GUEST: '이용객용',
  STAFF: '직원용',
};

export function qrFlowKey(flow: QrFlow): 'guest' | 'staff' {
  return flow === 'GUEST' ? 'guest' : 'staff';
}

export function qrStateLabel(state: QrState): string {
  if (!state.issued) return '미발급';
  return state.enabled ? '발급됨 · 접근 활성' : '발급됨 · 접근 중지';
}

const seoulDateTime = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

export function formatQrTimestamp(value: string): string {
  return seoulDateTime.format(new Date(value));
}

export function qrMutationFailure(error: unknown): {
  blocked: boolean;
  message: string;
} {
  const uncertain =
    !(error instanceof ApiRequestError) ||
    error.status === null ||
    error.status >= 500 ||
    (error.status >= 200 && error.status < 300);
  if (uncertain)
    return {
      blocked: true,
      message:
        '발급 결과를 확인하지 못했습니다. 서버에서는 이미 발급되었을 수 있습니다. 최신 상태를 확인해 주세요. 발급이 완료되었다면 응답을 받지 못한 주소는 복구할 수 없으며, 다시 발급하면 이전 QR이 무효화됩니다. 자동으로 재시도하지 않습니다.',
    };
  if (error.status === 404 || error.status === 409)
    return {
      blocked: true,
      message:
        '휴양소 또는 QR 발급 상태가 변경되었습니다. 최신 상태를 다시 불러와 확인한 뒤 발급 여부를 결정해 주세요.',
    };
  return {
    blocked: false,
    message:
      error.status === 429
        ? '요청이 많습니다. 잠시 기다린 뒤 다시 확인해 주세요.'
        : 'QR을 발급하지 못했습니다. 발급 상태를 확인한 뒤 다시 시도해 주세요.',
  };
}
