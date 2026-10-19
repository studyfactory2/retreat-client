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

function shortDate(value: string, includeYear: boolean) {
  const parts = dateFormat.formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';
  return `${includeYear ? `${part('year')}.` : ''}${Number(part('month'))}.${Number(part('day'))}`;
}

export function ScheduleRow({
  stay,
  detailHref,
}: {
  stay: AdminCalendarStayDto;
  detailHref: string;
}) {
  const includeYear =
    stay.checkIn.expectedDate.slice(0, 4) !== stay.checkOut.expectedDate.slice(0, 4);
  const startLabel = shortDate(stay.checkInAt, includeYear);
  const endLabel = shortDate(stay.checkOutAt, includeYear);

  return (
    <article className="schedule-row" aria-label={`${stay.property.name}, ${stay.guestName}`}>
      <div className="schedule-row__guest">
        <span className="schedule-row__avatar" aria-hidden="true">
          {Array.from(stay.guestName.trim())[0] || '이'}
        </span>
        <span>{stay.guestName}</span>
      </div>
      <div className="schedule-row__property">
        <strong>{stay.property.name}</strong>
        {!stay.property.isActive && (
          <span className="schedule-row__inactive">비활성</span>
        )}
      </div>
      <details className="schedule-row__period">
        <summary aria-label={`${startLabel}부터 ${endLabel}까지, 예정 시간 확인`}>
          <ScheduleIcon name="calendar" />
          <span className="schedule-row__range">
            <time dateTime={stay.checkInAt}>{startLabel}</time>
            <span aria-hidden="true">–</span>
            <span className="schedule-visually-hidden">부터</span>
            <time dateTime={stay.checkOutAt}>{endLabel}</time>
          </span>
          <ScheduleIcon name="chevron" />
        </summary>
        <div className="schedule-row__times">
          <dl>
            <div><dt>입실 예정</dt><dd><ScheduledTime value={stay.checkInAt} /></dd></div>
            <div><dt>퇴실 예정</dt><dd><ScheduledTime value={stay.checkOutAt} /></dd></div>
            {stay.property.region && <div><dt>지역</dt><dd>{stay.property.region}</dd></div>}
          </dl>
          <p>한국 시간 기준</p>
        </div>
      </details>
      <div className="schedule-row__checklists">
        <ScheduleChecklist label="입실" checklist={stay.checkIn} stayId={stay.id} />
        <ScheduleChecklist label="퇴실" checklist={stay.checkOut} stayId={stay.id} />
      </div>
      <Link
        className="schedule-row__detail"
        to={detailHref}
        aria-label={`${stay.property.name}, ${stay.guestName} 이용 일정 상세 보기`}
      >
        <ScheduleIcon name="arrow" /> 상세
      </Link>
    </article>
  );
}
