import type {
  StayCodeBlock,
  StayCodeMethod,
  StayCodeReviewReason,
} from '../../../../features/admin-stay-access/admin-stay-access.types';

export const stayCodeMethodLabel: Record<StayCodeMethod, string> = {
  AUTO: '자동 생성',
  PHONE_LAST6: '휴대폰 뒤 6자리',
  FIXED: '휴양소 고정 번호',
};
export const stayCodeBlockLabel: Record<StayCodeBlock, string> = {
  CANCELLED: '취소된 일정입니다. 저장된 번호만 확인할 수 있습니다.',
  ENDED: '퇴실 예정 시각이 지났습니다. 저장된 번호만 확인할 수 있습니다.',
  PROPERTY_INACTIVE: '비활성 휴양소입니다. 활성화 후 번호를 준비해 주세요.',
  PROPERTY_UNCONFIGURED: '휴양소의 출입 비밀번호 방식을 먼저 설정해 주세요.',
  FIXED_CODE_MISSING: '휴양소의 고정 비밀번호를 먼저 등록해 주세요.',
};
export const stayCodeReviewLabel: Record<StayCodeReviewReason, string> = {
  PHONE_CHANGED: '예약 연락처가 변경되었습니다.',
  GUEST_CHANGED: '이용객 이름이 변경되었습니다.',
  RESTORED: '취소했던 일정이 복원되었습니다.',
  PROPERTY_MODE_CHANGED: '휴양소의 비밀번호 방식이 변경되었습니다.',
  FIXED_CODE_CHANGED: '휴양소의 고정 번호가 변경되었습니다.',
  NEIGHBOR_CODE_CONFLICT:
    '앞뒤 예약과 같은 번호입니다. 다른 번호를 준비해 주세요.',
  SOURCE_UNAVAILABLE: '번호를 준비한 당시 정보를 확인할 수 없습니다.',
};
const formatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
export const formatStayCodeTime = (value: string): string =>
  formatter.format(new Date(value));
