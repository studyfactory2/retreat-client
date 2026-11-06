import { getSeoulToday } from '../../../../core/dates/seoul-date';
import type { GuestEntryContext } from '../../../../features/guest-entry/guest-entry.types';

const scheduleDay = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: 'long',
  day: 'numeric',
  weekday: 'short',
});
const scheduleClock = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function StayScheduleRow({
  label,
  value,
  currentYear,
}: {
  label: string;
  value: string;
  currentYear: string;
}) {
  const date = new Date(value);
  const valid = Number.isFinite(date.getTime());
  const year = valid ? getSeoulToday(date).slice(0, 4) : '';
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        {valid ? (
          <time dateTime={value}>
            <span>
              {year !== currentYear && `${year}년 `}
              {scheduleDay.format(date)}
            </span>{' '}
            <strong>{scheduleClock.format(date)}</strong>
          </time>
        ) : (
          '확인 필요'
        )}
      </dd>
    </div>
  );
}

export function GuestHomeHeader({ entry }: { entry: GuestEntryContext }) {
  const { property } = entry.context;
  const stay = entry.kind === 'stay' ? entry.context : null;
  const currentYear = stay ? getSeoulToday().slice(0, 4) : '';
  return (
    <section className="guest-home-header" aria-labelledby="guest-home-title">
      <div className="guest-home-header__identity">
        <h1 id="guest-home-title">{property.name}</h1>
        <p className="guest-home-header__meta">
          {property.region && (
            <>
              <span>{property.region}</span>
              <span aria-hidden="true">·</span>
            </>
          )}
          <span>{stay ? `${stay.guestName}님의 예약` : '공용 이용 안내'}</span>
        </p>
      </div>
      {stay && (
        <div className="guest-home-schedule">
          <dl aria-label="나의 예정 일정 · 한국 시간">
            <StayScheduleRow
              label="입실 예정"
              value={stay.checkInAt}
              currentYear={currentYear}
            />
            <StayScheduleRow
              label="퇴실 예정"
              value={stay.checkOutAt}
              currentYear={currentYear}
            />
          </dl>
          <p>한국 시간 기준</p>
        </div>
      )}
    </section>
  );
}
