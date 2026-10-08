import type {
  MaintenanceReviewReason,
  MaintenanceStatus,
} from '../../../../features/admin-maintenance/admin-maintenance.types';

export const maintenanceStatuses: Record<
  MaintenanceStatus,
  { label: string; tone: string; description: string }
> = {
  UNFINISHED: {
    label: '작성 중',
    tone: 'blue',
    description: '직원이 이어서 작성할 수 있습니다.',
  },
  EXPIRED: {
    label: '기한 만료',
    tone: 'amber',
    description: '작성 기한이 지난 미제출 기록입니다.',
  },
  ACCESS_BLOCKED: {
    label: '접근 불가',
    tone: 'red',
    description: '직원이 이어서 작성할 수 없는 기록입니다.',
  },
  COMPLETED: {
    label: '제출됨',
    tone: 'green',
    description: '저장된 체크리스트와 사진을 열 수 있습니다.',
  },
  NEEDS_REVIEW: {
    label: '확인 필요',
    tone: 'red',
    description: '저장된 기록을 확인해야 합니다. 상세를 열 수 없습니다.',
  },
};
export const maintenanceReasons: Record<MaintenanceReviewReason, string> = {
  INVALID_RECORD: '저장된 기록 확인 필요',
  TOKEN_EXPIRED: '작성 기한 만료',
  TOKEN_UNAVAILABLE: '작성 접근 정보 없음',
  PROPERTY_INACTIVE: '휴양소 비활성',
  STAFF_ASSIGNMENT_CHANGED: '담당 직원 배정 변경',
  STAFF_INACTIVE: '직원 비활성',
};
export function maintenanceTime(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}
