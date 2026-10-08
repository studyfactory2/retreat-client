import { Link } from 'react-router-dom';
import type { AdminCalendarStayDto } from '../../../../features/admin-calendar/admin-calendar.types';
import { ScheduleChecklist } from './ScheduleChecklist';

const dateFormat = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const timeFormat = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
function ScheduledTime({ value }: { value: string }) {
  return (
    <time dateTime={value}>
      <span>{dateFormat.format(new Date(value))}</span>
      <span>{timeFormat.format(new Date(value))}</span>
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
  return (
    <article className="schedule-row">
      <div className="schedule-row__identity">
        <h2>{stay.property.name}</h2>
        <p>
          <span>이용객</span> <strong>{stay.guestName}</strong>
        </p>
        {!stay.property.isActive && <small>비활성 휴양소</small>}
      </div>
      <dl className="schedule-row__period">
        <div>
          <dt>입실 예정</dt>
          <dd>
            <ScheduledTime value={stay.checkInAt} />
          </dd>
        </div>
        <div>
          <dt>퇴실 예정</dt>
          <dd>
            <ScheduledTime value={stay.checkOutAt} />
          </dd>
        </div>
      </dl>
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
        상세 보기 <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
