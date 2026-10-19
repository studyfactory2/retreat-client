import { Link } from 'react-router-dom';
import type { AdminCalendarStayDto } from '../../../../features/admin-calendar/admin-calendar.types';
import { ScheduleChecklist } from './ScheduleChecklist';
import { ScheduleIcon } from './ScheduleIcon';

const dateFormat = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const shortDateFormat = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: 'numeric',
  day: 'numeric',
});
const timeFormat = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function ScheduledTime({ value }: { value: string }) {
  const date = new Date(value);
  return (
    <time dateTime={value}>
      <span>{dateFormat.format(date)}</span>
      <span>{timeFormat.format(date)}</span>
    </time>
  );
}

export function ScheduleRow({
  stay,
  detailHref,
}: {
  stay: AdminCalendarStayDto;
  detailHref: string;
}) {
  const rangeFormat =
    stay.checkIn.expectedDate.slice(0, 4) === stay.checkOut.expectedDate.slice(0, 4)
      ? shortDateFormat
      : dateFormat;

  return (
    <article className="schedule-row">
      <div className="schedule-row__identity">
        <span className="schedule-row__avatar" aria-hidden="true">
          {Array.from(stay.guestName)[0]}
        </span>
        <div>
          <span className="schedule-row__label">이용객</span>
          <h3>{stay.guestName}</h3>
        </div>
      </div>
      <div className="schedule-row__property">
        <span className="schedule-row__label">휴양소</span>
        <strong>{stay.property.name}</strong>
        {stay.property.region && <small>{stay.property.region}</small>}
        {!stay.property.isActive && (
          <small className="schedule-row__inactive">비활성 휴양소</small>
        )}
      </div>
      <div className="schedule-row__period">
        <span className="schedule-row__label">이용 기간</span>
        <p className="schedule-row__range">
          <time dateTime={stay.checkInAt}>
            {rangeFormat.format(new Date(stay.checkInAt))}
          </time>
          <span aria-hidden="true">–</span>
          <span className="schedule-visually-hidden">부터</span>
          <time dateTime={stay.checkOutAt}>
            {rangeFormat.format(new Date(stay.checkOutAt))}
          </time>
        </p>
        <details className="schedule-row__times">
          <summary>
            예정 시간 <ScheduleIcon name="chevron" />
          </summary>
          <dl>
            <div>
              <dt>입실 예정</dt>
              <dd><ScheduledTime value={stay.checkInAt} /></dd>
            </div>
            <div>
              <dt>퇴실 예정</dt>
              <dd><ScheduledTime value={stay.checkOutAt} /></dd>
            </div>
          </dl>
        </details>
      </div>
      <div
        className="schedule-row__checklists"
        aria-label="체크리스트 제출 현황"
      >
        <ScheduleChecklist
          label="입실"
          checklist={stay.checkIn}
          stayId={stay.id}
        />
        <ScheduleChecklist
          label="퇴실"
          checklist={stay.checkOut}
          stayId={stay.id}
        />
      </div>
      <Link
        className="schedule-row__detail"
        to={detailHref}
        aria-label={`${stay.property.name}, ${stay.guestName} 이용 일정 상세 보기`}
      >
        상세 <ScheduleIcon name="arrow" />
      </Link>
    </article>
  );
}
