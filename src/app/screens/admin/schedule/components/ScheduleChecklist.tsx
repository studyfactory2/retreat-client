import { Link } from 'react-router-dom';
import type {
  CalendarChecklistDto,
  CalendarChecklistStatus,
  CalendarReviewReason,
} from '../../../../features/admin-calendar/admin-calendar.types';
import { ScheduleIcon } from './ScheduleIcon';

const statusLabels: Record<CalendarChecklistStatus, string> = {
  SCHEDULED: '예정',
  NOT_SUBMITTED: '미제출',
  SUBMITTED: '제출됨',
  NEEDS_REVIEW: '확인 필요',
};
const reasonLabels: Record<CalendarReviewReason, string> = {
  DUPLICATE_SUBMISSIONS: '중복 제출 내역이 있습니다.',
  STAY_CHANGED: '제출 후 이용 일정이 변경되었습니다.',
  VISIT_DATE_MISMATCH: '제출한 이용일과 예정일이 다릅니다.',
  MISSING_MATCH_CONTEXT: '이용 일정 연결 정보를 확인해 주세요.',
  INVALID_SUBMISSION_RECORD: '제출 기록 정보를 확인해 주세요.',
};

type ChecklistProps = {
  label: string;
  checklist: CalendarChecklistDto;
};

function hasScheduleChecklistDetails(checklist: CalendarChecklistDto) {
  return checklist.reviewReasons.length > 0 || checklist.submissionCount > 0;
}

function ScheduleChecklistBadge({ label, checklist }: ChecklistProps) {
  return (
    <>
      <span className="schedule-visually-hidden">{label} </span>
      <span
        className={`schedule-checklist__badge schedule-checklist__badge--${checklist.status.toLowerCase()}`}
      >
        {statusLabels[checklist.status]}
      </span>
    </>
  );
}

export function ScheduleChecklist({
  label,
  checklist,
  expanded,
  panelId,
  triggerId,
  onToggle,
}: ChecklistProps & {
  expanded: boolean;
  panelId: string;
  triggerId: string;
  onToggle: () => void;
}) {
  if (!hasScheduleChecklistDetails(checklist)) {
    return (
      <span className="schedule-checklist__cell">
        <ScheduleChecklistBadge label={label} checklist={checklist} />
      </span>
    );
  }

  return (
    <button
      type="button"
      id={triggerId}
      className="schedule-checklist__toggle"
      aria-expanded={expanded}
      aria-controls={panelId}
      onClick={onToggle}
    >
      <ScheduleChecklistBadge label={label} checklist={checklist} />
      <span className="schedule-visually-hidden"> 상세</span>
    </button>
  );
}

export function ScheduleChecklistDetails({
  label,
  checklist,
  stayId,
}: ChecklistProps & { stayId: string }) {
  return (
    <div className="schedule-checklist__body">
      <h3>{label} 체크리스트</h3>
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
          {label} 기록 {checklist.submissionCount.toLocaleString('ko-KR')}건
          보기
          <ScheduleIcon name="arrow" />
        </Link>
      )}
    </div>
  );
}
