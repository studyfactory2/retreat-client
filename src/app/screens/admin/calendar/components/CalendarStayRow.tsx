import { Link } from 'react-router-dom';
import type {
  CalendarChecklistDto,
  CalendarChecklistStatus,
  CalendarReviewReason,
} from '../../../../features/admin-calendar/admin-calendar.types';
import type { CalendarAgendaEntry } from '../model/calendar-agenda';

const checklistLabels: Record<CalendarChecklistStatus, string> = {
  SCHEDULED: '예정',
  NOT_SUBMITTED: '미제출',
  SUBMITTED: '제출됨',
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
const periodFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'UTC',
  month: 'numeric',
  day: 'numeric',
});
const eventTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
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
        <ul className="calendar-stay__review-reasons">
          {checklist.reviewReasons.map((reason) => (
            <li key={reason}>{reviewReasonLabels[reason]}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CalendarStayRow({
  entry,
  returnSearch,
}: {
  entry: CalendarAgendaEntry;
  returnSearch: string;
}) {
  const { stay } = entry;
  const eventLabel =
    entry.kind === 'arrival'
      ? '입실 예정'
      : entry.kind === 'departure'
        ? '퇴실 예정'
        : '연속 일정';
  const time =
    entry.kind === 'continuing'
      ? undefined
      : eventTimeFormatter.format(new Date(entry.at));
  const relevantChecklists =
    entry.kind === 'arrival'
      ? [stay.checkIn]
      : entry.kind === 'departure'
        ? [stay.checkOut]
        : [stay.checkIn, stay.checkOut];
  const needsReview = relevantChecklists.some(
    (checklist) => checklist.status === 'NEEDS_REVIEW',
  );
  const PropertyHeading = entry.kind === 'continuing' ? 'h4' : 'h3';
  const crossYear =
    stay.checkIn.expectedDate.slice(0, 4) !==
    stay.checkOut.expectedDate.slice(0, 4);
  function formatPeriodDay(value: string) {
    const label = periodFormatter.format(new Date(`${value}T00:00:00Z`));
    return crossYear ? `${value.slice(0, 4)}. ${label}` : label;
  }
  return (
    <article className={`calendar-stay calendar-stay--${entry.kind}`}>
      <Link
        className="calendar-stay__main"
        to={`/admin/stays/${stay.id}${returnSearch}`}
        aria-label={`${time ? `${time} ` : ''}${eventLabel}, ${stay.property.name}, ${stay.guestName}${needsReview ? ', 확인 필요' : ''}${!stay.property.isActive ? ', 비활성' : ''} 이용 일정 상세 보기`}
      >
        <div className="calendar-stay__event">
          {entry.kind !== 'continuing' ? (
            <time dateTime={entry.at}>{time}</time>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="4" y="5" width="16" height="16" rx="3" />
              <path d="M8 3v4m8-4v4M4 11h16m-10 5h4" />
            </svg>
          )}
          <span>{eventLabel}</span>
        </div>
        <div className="calendar-stay__identity">
          <PropertyHeading>{stay.property.name}</PropertyHeading>
          <div className="calendar-stay__meta">
            <p className="calendar-stay__guest">{stay.guestName}</p>
            {needsReview && (
              <span className="calendar-stay__review-alert">확인 필요</span>
            )}
            {!stay.property.isActive && (
              <span className="calendar-stay__inactive">비활성</span>
            )}
          </div>
          {entry.kind === 'continuing' && (
            <p className="calendar-stay__dates">
              <time dateTime={stay.checkIn.expectedDate}>
                {formatPeriodDay(stay.checkIn.expectedDate)}
              </time>
              <span aria-hidden="true">–</span>
              <time dateTime={stay.checkOut.expectedDate}>
                {formatPeriodDay(stay.checkOut.expectedDate)}
              </time>
            </p>
          )}
        </div>
      </Link>
      <details className="calendar-stay__details">
        <summary
          aria-label={`${time ? `${time} ` : ''}${eventLabel}, ${stay.property.name}, ${stay.guestName} 체크리스트 및 상세 시간`}
          title="체크리스트 · 상세 시간"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m7 10 5 5 5-5" />
          </svg>
        </summary>
        <div className="calendar-stay__details-body">
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
        </div>
      </details>
    </article>
  );
}
