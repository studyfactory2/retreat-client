import { Link } from 'react-router-dom';
import type { AdminStayDto } from '../../../../features/admin-stays/admin-stays.types';

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function StayListCard({
  stay,
  detailHref,
}: {
  stay: AdminStayDto;
  detailHref: string;
}) {
  return (
    <article className="admin-directory-row">
      <div className="admin-directory-identity">
        <h2>{stay.property.name}</h2>
        <p className="stay-list-guest">{stay.guestName}</p>
        {!stay.property.isActive && (
          <p className="admin-directory-muted">비활성 휴양소</p>
        )}
      </div>
      <dl className="admin-directory-fields">
        <div>
          <dt>입실 예정</dt>
          <dd>
            <time dateTime={stay.checkInAt}>
              {dateFormatter.format(new Date(stay.checkInAt))}
            </time>
          </dd>
        </div>
        <div>
          <dt>퇴실 예정</dt>
          <dd>
            <time dateTime={stay.checkOutAt}>
              {dateFormatter.format(new Date(stay.checkOutAt))}
            </time>
          </dd>
        </div>
      </dl>
      <span
        className={`admin-directory-status${stay.status === 'CANCELLED' ? ' admin-directory-status--inactive' : ''}`}
      >
        {stay.status === 'ACTIVE' ? '등록됨' : '취소됨'}
      </span>
      <Link
        className="admin-directory-detail"
        to={detailHref}
        aria-label={`${stay.guestName}, ${stay.property.name} 이용 일정 상세 보기`}
      >
        상세 보기 <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
