import { ApiRequestError } from '../../../../core/api/api-error';
import type { StaffQrContextDto } from '../../../../features/staff-entry/staff-entry.types';

export type StaffStartStatus =
  'idle' | 'checking' | 'starting' | 'uncertain' | 'opening' | 'denied';

export interface StaffStartState {
  status: StaffStartStatus;
  confirmed: boolean;
  message: string;
}

export function createStaffStartState(): StaffStartState {
  return { status: 'idle', confirmed: false, message: '' };
}

export function staffStartConfigured(context: StaffQrContextDto): boolean {
  return context.assignedStaff !== null && context.checklists.length === 1;
}

export function sameStaffStartContext(
  before: StaffQrContextDto,
  after: StaffQrContextDto,
): boolean {
  return (
    before.property.id === after.property.id &&
    before.assignedStaff?.id === after.assignedStaff?.id &&
    before.assignedStaff?.name === after.assignedStaff?.name &&
    before.checklists[0]?.id === after.checklists[0]?.id &&
    before.checklists[0]?.version === after.checklists[0]?.version
  );
}

export function staffStartFailure(
  error: unknown,
  submitted: boolean,
): {
  kind: 'denied' | 'configuration' | 'uncertain' | 'retry';
  message: string;
} {
  const failure = error instanceof ApiRequestError ? error : null;
  if (
    failure?.status === 401 ||
    failure?.status === 403 ||
    failure?.code === 'INVALID_QR'
  )
    return {
      kind: 'denied',
      message: '이 직원용 QR을 사용할 수 없습니다. 관리자에게 문의해 주세요.',
    };
  if (
    submitted &&
    (failure === null ||
      failure.status === null ||
      failure.status < 400 ||
      failure.status === 408 ||
      failure.status >= 500 ||
      failure.code === 'DRAFT_REQUEST_EXISTS')
  )
    return {
      kind: 'uncertain',
      message:
        '시작 결과를 확인하지 못했습니다. 서버에 정비 기록이 만들어졌을 수 있지만, 이어쓰기 링크를 확인하지 못했습니다. 같은 요청을 다시 보내도 링크를 되찾을 수 없습니다.',
    };
  if (
    failure?.code === 'STAFF_ASSIGNMENT_CHANGED' ||
    failure?.code === 'CHECKLIST_UNAVAILABLE'
  )
    return {
      kind: 'configuration',
      message:
        '담당 직원이나 체크리스트 설정이 변경되었습니다. 새로 불러온 내용을 확인한 뒤 다시 시작해 주세요.',
    };
  return {
    kind: 'retry',
    message:
      failure?.status === 429
        ? '요청이 많습니다. 잠시 후 다시 시도해 주세요.'
        : failure?.status === 400
          ? failure.message
          : '정비 시작 정보를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.',
  };
}
