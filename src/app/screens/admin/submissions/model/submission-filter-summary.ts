import type { AdminPropertyOption } from '../../../../features/admin-properties/admin-properties.types';
import type { AdminSubmissionListInput } from '../../../../features/admin-submissions/admin-submissions.types';
import {
  appliedDateRange,
  appliedPropertyLabel,
} from '../../model/applied-filter-summary';
import { submissionTypeLabel } from './submission-list-model';

export function submissionAppliedSummary(
  input: AdminSubmissionListInput,
  properties?: AdminPropertyOption[],
) {
  const unlinked = input.linkStatus === 'UNLINKED';
  return [
    {
      label: '휴양소',
      value: appliedPropertyLabel(input.propertyId, properties),
    },
    {
      label: '기록 유형',
      value: input.type
        ? submissionTypeLabel[input.type]
        : unlinked
          ? '입실·퇴실'
          : '전체 유형',
    },
    {
      label: '기록 상태',
      value:
        input.status === 'CANCELLED'
          ? '취소됨'
          : input.status === 'SUBMITTED' || unlinked
            ? '제출됨'
            : '전체 상태',
    },
    {
      label: '일정 연결',
      value: input.stayId
        ? '선택한 이용 일정'
        : unlinked
          ? '미연결 이용객 기록'
          : input.linkStatus === 'LINKED'
            ? '연결됨'
            : '전체 연결 상태',
    },
    { label: '방문일', value: appliedDateRange(input.from, input.to) },
  ];
}
