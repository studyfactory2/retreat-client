import type {
  AdminCalendarStayDto,
  CalendarChecklistDto,
  CalendarChecklistStatus,
  CalendarReviewReason,
} from '../../../features/admin-calendar/admin-calendar.types';
import './calendar-panels.css';

type SelectedDayStaysProps = {
  date: string;
  stays: AdminCalendarStayDto[];
};

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

const selectedDateFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'UTC',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
});

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
}: {
  label: string;
  checklist: CalendarChecklistDto;
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

export function SelectedDayStays({ date, stays }: SelectedDayStaysProps) {
  const selectedDate = selectedDateFormatter.format(
    new Date(`${date}T00:00:00Z`),
  );

  return (
    <section
      className="calendar-selected"
      aria-labelledby="calendar-selected-title"
    >
      <header className="calendar-selected__heading">
        <span className="calendar-selected__eyebrow">SELECTED DAY</span>
        <div>
          <h2 id="calendar-selected-title">
            <time dateTime={date}>{selectedDate}</time>
          </h2>
          <span className="calendar-selected__count">
            {stays.length.toLocaleString('ko-KR')}건
          </span>
        </div>
        <p>선택한 날짜에 연결된 이용 일정입니다.</p>
      </header>

      {stays.length > 0 ? (
        <>
          <div
            className="calendar-selected__scroll"
            role="region"
            aria-label="선택일 이용 일정 목록"
            tabIndex={0}
          >
            <ol className="calendar-selected__stays">
              {stays.map((stay) => {
                const isArrival = stay.checkIn.expectedDate === date;
                const isDeparture = stay.checkOut.expectedDate === date;

                return (
                  <li key={stay.id}>
                    <article className="calendar-stay">
                      <div className="calendar-stay__topline">
                        <div className="calendar-stay__events">
                          {isArrival && <span>입실 예정</span>}
                          {isDeparture && <span>퇴실 예정</span>}
                          {!isArrival && !isDeparture && <span>연속 일정</span>}
                        </div>
                        {!stay.property.isActive && (
                          <span className="calendar-stay__inactive">
                            비활성 휴양소
                          </span>
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
                              {stayDateFormatter.format(
                                new Date(stay.checkInAt),
                              )}
                            </time>
                          </dd>
                        </div>
                        <div>
                          <dt>퇴실 예정</dt>
                          <dd>
                            <time dateTime={stay.checkOutAt}>
                              {stayDateFormatter.format(
                                new Date(stay.checkOutAt),
                              )}
                            </time>
                          </dd>
                        </div>
                      </dl>
                      <div className="calendar-stay__checklists">
                        <ChecklistStatus
                          label="입실 체크"
                          checklist={stay.checkIn}
                        />
                        <ChecklistStatus
                          label="퇴실 체크"
                          checklist={stay.checkOut}
                        />
                      </div>
                    </article>
                  </li>
                );
              })}
            </ol>
          </div>
          <p className="calendar-selected__note">
            입·퇴실 예정 시간은 한국 시간 기준입니다.
          </p>
        </>
      ) : (
        <div className="calendar-selected__empty">
          <span aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="4" y="5" width="16" height="16" rx="2" />
              <path d="M8 3v4m8-4v4M4 10h16m-12 5h3" />
            </svg>
          </span>
          <h3>등록된 이용 일정이 없습니다</h3>
          <p>다른 날짜를 선택해 일정을 확인해 주세요.</p>
        </div>
      )}
    </section>
  );
}
