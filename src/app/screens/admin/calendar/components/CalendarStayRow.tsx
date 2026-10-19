import { Link } from 'react-router-dom';
import type {
  AdminCalendarStayDto,
  CalendarChecklistDto,
  CalendarChecklistStatus,
  CalendarReviewReason,
} from '../../../../features/admin-calendar/admin-calendar.types';

const checklistLabels: Record<CalendarChecklistStatus, string> = {
  SCHEDULED: '작성 예정',
  NOT_SUBMITTED: '미제출',
  SUBMITTED: '제출 완료',
  NEEDS_REVIEW: '확인 필요',
};
const reviewReasonLabels: Record<CalendarReviewReason, string> = {
  DUPLICATE_SUBMISSIONS: '중복 제출 내역이 있습니다.',
  STAY_CHANGED: '제출 후 이용 일정이 변경되었습니다.',
  VISIT_DATE_MISMATCH: '제출한 이용일과 예정일이 다릅니다.',
  MISSING_MATCH_CONTEXT: '이용 일정 연결 정보를 확인해 주세요.',
  INVALID_SUBMISSION_RECORD: '제출 기록 정보를 확인해 주세요.',
};
const stayDateFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function ChecklistStatus({
  label,
  checklist,
  stayId,
}: {
  label: string;
  checklist: CalendarChecklistDto;
  stayId: string;
}) {
  return (
    <div className="calendar-stay__checklist">
      <div className="calendar-stay__checklist-heading">
        <span>{label}</span>
        <span
          className={`calendar-stay__status calendar-stay__status--${checklist.status.toLowerCase()}`}
        >
          {checklistLabels[checklist.status]}
        </span>
      </div>
      {checklist.submissionCount > 0 && (
        <Link
          className="calendar-stay__records"
          to={`/admin/submissions?stayId=${stayId}&type=${checklist.type}&status=SUBMITTED`}
        >
          {label} 기록 {checklist.submissionCount.toLocaleString('ko-KR')}건
          보기
        </Link>
      )}
      {checklist.reviewReasons.length > 0 && (
        <details className="calendar-stay__review">
          <summary>확인 사유</summary>
          <ul className="calendar-stay__review-reasons">
          {checklist.reviewReasons.map((reason) => (
            <li key={reason}>{reviewReasonLabels[reason]}</li>
          ))}
          </ul>
        </details>
      )}
    </div>
  );
}

export function CalendarStayRow({
  stay,
  date,
  returnSearch,
}: {
  stay: AdminCalendarStayDto;
  date: string;
  returnSearch: string;
}) {
  const isArrival = stay.checkIn.expectedDate === date;
  const isDeparture = stay.checkOut.expectedDate === date;
  return (
    <article className="calendar-stay">
      <div className="calendar-stay__topline">
        <div className="calendar-stay__events">
          {isArrival && <span>입실 예정</span>}
          {isDeparture && <span>퇴실 예정</span>}
          {!isArrival && !isDeparture && <span>연속 일정</span>}
        </div>
        {!stay.property.isActive && (
          <span className="calendar-stay__inactive">비활성 휴양소</span>
        )}
      </div>
      <h3>{stay.property.name}</h3>
      <p className="calendar-stay__guest">
        <span>이용객</span>
        <strong>{stay.guestName}</strong>
      </p>
      <dl className="calendar-stay__period">
        <div>
          <dt>입실 예정</dt>
          <dd>
            <time dateTime={stay.checkInAt}>
              {stayDateFormatter.format(new Date(stay.checkInAt))}
            </time>
          </dd>
        </div>
        <div>
          <dt>퇴실 예정</dt>
          <dd>
            <time dateTime={stay.checkOutAt}>
              {stayDateFormatter.format(new Date(stay.checkOutAt))}
            </time>
          </dd>
        </div>
      </dl>
      <div className="calendar-stay__checklists">
        <ChecklistStatus
          label="입실 체크"
          checklist={stay.checkIn}
          stayId={stay.id}
        />
        <ChecklistStatus
          label="퇴실 체크"
          checklist={stay.checkOut}
          stayId={stay.id}
        />
      </div>
      <Link
        className="calendar-stay__detail"
        to={`/admin/stays/${stay.id}${returnSearch}`}
        aria-label={`${stay.property.name}, ${stay.guestName} 이용 일정 상세 보기`}
      >
        상세 보기 <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
