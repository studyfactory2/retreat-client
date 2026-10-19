import { Link } from 'react-router-dom';
import type {
  CalendarChecklistDto,
  CalendarChecklistStatus,
  CalendarReviewReason,
} from '../../../../features/admin-calendar/admin-calendar.types';
import { ScheduleIcon } from './ScheduleIcon';

const statusLabels: Record<CalendarChecklistStatus, string> = {
  SCHEDULED: '작성 예정',
  NOT_SUBMITTED: '미제출',
  SUBMITTED: '제출 완료',
  NEEDS_REVIEW: '확인 필요',
};
const reasonLabels: Record<CalendarReviewReason, string> = {
  DUPLICATE_SUBMISSIONS: '중복 제출 내역이 있습니다.',
  STAY_CHANGED: '제출 후 이용 일정이 변경되었습니다.',
  VISIT_DATE_MISMATCH: '제출한 이용일과 예정일이 다릅니다.',
  MISSING_MATCH_CONTEXT: '이용 일정 연결 정보를 확인해 주세요.',
  INVALID_SUBMISSION_RECORD: '제출 기록 정보를 확인해 주세요.',
};

export function ScheduleChecklist({
  label,
  checklist,
  stayId,
}: {
  label: string;
  checklist: CalendarChecklistDto;
  stayId: string;
}) {
  const hasDetails =
    checklist.reviewReasons.length > 0 || checklist.submissionCount > 0;
  const status = (
    <>
      <span className="schedule-checklist__label">{label}</span>
      <span
        className={`schedule-checklist__badge schedule-checklist__badge--${checklist.status.toLowerCase()}`}
      >
        {statusLabels[checklist.status]}
      </span>
    </>
  );

  if (!hasDetails) {
    return (
      <div className="schedule-checklist schedule-checklist__summary">
        {status}
      </div>
    );
  }

  return (
    <details className="schedule-checklist">
      <summary
        className="schedule-checklist__summary"
        aria-label={`${label} ${statusLabels[checklist.status]}, 상세 확인`}
      >
        {status}
        <ScheduleIcon name="chevron" />
      </summary>
      <div className="schedule-checklist__body">
        {checklist.reviewReasons.length > 0 && (
          <ul className="schedule-checklist__reasons">
            {checklist.reviewReasons.map((reason) => (
              <li key={reason}>{reasonLabels[reason]}</li>
            ))}
          </ul>
        )}
        {checklist.submissionCount > 0 && (
          <Link
            className="schedule-checklist__records"
            to={`/admin/submissions?${new URLSearchParams({ stayId, type: checklist.type, status: 'SUBMITTED' })}`}
          >
            {label} 기록 {checklist.submissionCount.toLocaleString('ko-KR')}건 보기
            <ScheduleIcon name="arrow" />
          </Link>
        )}
      </div>
    </details>
  );
}
