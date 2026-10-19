import { Link } from 'react-router-dom';
import { getSeoulToday } from '../../../../core/dates/seoul-date';
import type {
  AdminCalendarStayDto,
  CalendarChecklistDto,
  CalendarChecklistStatus,
} from '../../../../features/admin-calendar/admin-calendar.types';
import { submissionTime } from '../../submissions/model/submission-list-model';

const shortDate = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: '2-digit',
  day: '2-digit',
});
const fullDate = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const statusLabels: Record<CalendarChecklistStatus, string> = {
  SCHEDULED: '작성 예정',
  NOT_SUBMITTED: '미제출',
  SUBMITTED: '제출 완료',
  NEEDS_REVIEW: '확인 필요',
};

function StayPeriod({ stay }: { stay: AdminCalendarStayDto }) {
  const crossesYears =
    getSeoulToday(new Date(stay.checkInAt)).slice(0, 4) !==
    getSeoulToday(new Date(stay.checkOutAt)).slice(0, 4);
  const formatter = crossesYears ? fullDate : shortDate;
  return (
    <>
      <span className="dashboard-activity__period-label">이용일</span>
      <span className="dashboard-activity__period-range">
        <time
          dateTime={stay.checkInAt}
          title={`입실 예정 ${submissionTime(stay.checkInAt)}`}
          aria-label={`입실 예정 ${submissionTime(stay.checkInAt)}`}
        >
          {formatter.format(new Date(stay.checkInAt))}
        </time>
        <span aria-hidden="true">–</span>
        <time
          dateTime={stay.checkOutAt}
          title={`퇴실 예정 ${submissionTime(stay.checkOutAt)}`}
          aria-label={`퇴실 예정 ${submissionTime(stay.checkOutAt)}`}
        >
          {formatter.format(new Date(stay.checkOutAt))}
        </time>
      </span>
    </>
  );
}

function ChecklistStatus({
  label,
  checklist,
  stayId,
}: {
  label: string;
  checklist: CalendarChecklistDto;
  stayId: string;
}) {
  const badge = (
    <span
      className={`dashboard-activity__badge dashboard-activity__badge--${checklist.status.toLowerCase()}`}
    >
      {statusLabels[checklist.status]}
    </span>
  );
  return (
    <div className="dashboard-activity__checklist">
      <span className="dashboard-activity__checklist-label">{label}</span>
      {checklist.status === 'SUBMITTED' ||
      checklist.status === 'NEEDS_REVIEW' ? (
        <Link
          className="dashboard-activity__checklist-target"
          to={`/admin/submissions?${new URLSearchParams({
            stayId,
            type: checklist.type,
            status: 'SUBMITTED',
          })}`}
          aria-label={`${label} 체크 · ${statusLabels[checklist.status]} · 제출 기록 ${checklist.submissionCount.toLocaleString('ko-KR')}건 보기`}
        >
          {badge}
        </Link>
      ) : (
        <span className="dashboard-activity__checklist-target">{badge}</span>
      )}
    </div>
  );
}

export function DashboardStayActivity({
  items,
  returnSearch,
}: {
  items: AdminCalendarStayDto[];
  returnSearch: string;
}) {
  return (
    <table className="dashboard-activity__stays" role="table">
      <caption className="dashboard-activity__sr-only">
        선택일과 겹치는 이용 일정과 체크리스트 제출 현황
      </caption>
      <thead role="rowgroup">
        <tr role="row">
          <th scope="col" role="columnheader">
            휴양소 · 이용객
          </th>
          <th scope="col" role="columnheader">
            이용 일정
          </th>
          <th scope="col" role="columnheader">
            입실 체크
          </th>
          <th scope="col" role="columnheader">
            퇴실 체크
          </th>
          <th scope="col" role="columnheader">
            <span className="dashboard-activity__sr-only">상세</span>
          </th>
        </tr>
      </thead>
      <tbody role="rowgroup">
        {items.map((stay) => (
          <tr key={stay.id} role="row">
            <td className="dashboard-activity__stay-identity" role="cell">
              <strong>{stay.property.name}</strong>
              <p>{stay.guestName}</p>
              {!stay.property.isActive && (
                <span className="dashboard-activity__inactive">
                  비활성 휴양소
                </span>
              )}
            </td>
            <td className="dashboard-activity__stay-period" role="cell">
              <StayPeriod stay={stay} />
            </td>
            <td className="dashboard-activity__stay-check" role="cell">
              <ChecklistStatus
                label="입실"
                checklist={stay.checkIn}
                stayId={stay.id}
              />
            </td>
            <td className="dashboard-activity__stay-check" role="cell">
              <ChecklistStatus
                label="퇴실"
                checklist={stay.checkOut}
                stayId={stay.id}
              />
            </td>
            <td className="dashboard-activity__stay-action" role="cell">
              <Link
                to={`/admin/stays/${stay.id}${returnSearch}`}
                aria-label={`${stay.property.name}, ${stay.guestName} 이용 일정 상세 보기`}
              >
                상세 <span aria-hidden="true">↗</span>
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
