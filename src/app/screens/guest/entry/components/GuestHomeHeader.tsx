import type { GuestEntryContext } from '../../../../features/guest-entry/guest-entry.types';
import { formatGuestStayTimestamp } from '../model/guest-entry-model';

export function GuestHomeHeader({ entry }: { entry: GuestEntryContext }) {
  const { property } = entry.context;
  return (
    <section className="guest-home-header" aria-labelledby="guest-home-title">
      <div className="guest-home-header__meta">
        <p>{property.region || '휴양소'}</p>
        <span>
          {entry.kind === 'stay' ? '개인 이용 안내' : '공용 이용 안내'}
        </span>
      </div>
      <h1 id="guest-home-title">{property.name}</h1>
      <p className="guest-home-header__greeting">
        {entry.kind === 'stay'
          ? `${entry.context.guestName}님, 편안한 시간 보내세요.`
          : '편안한 이용을 위한 안내를 확인해 주세요.'}
      </p>
      {entry.kind === 'stay' && (
        <div className="guest-home-schedule">
          <dl aria-label="나의 예정 일정 · 한국 시간">
            <div>
              <dt>입실 예정</dt>
              <dd>
                <time dateTime={entry.context.checkInAt}>
                  {formatGuestStayTimestamp(entry.context.checkInAt)}
                </time>
              </dd>
            </div>
            <div>
              <dt>퇴실 예정</dt>
              <dd>
                <time dateTime={entry.context.checkOutAt}>
                  {formatGuestStayTimestamp(entry.context.checkOutAt)}
                </time>
              </dd>
            </div>
          </dl>
          <p>한국 시간 기준</p>
        </div>
      )}
    </section>
  );
}
