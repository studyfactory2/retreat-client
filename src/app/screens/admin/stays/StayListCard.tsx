import { Link } from 'react-router-dom';
import type { AdminStayDto } from '../../../features/admin-stays/admin-stays.types';

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
    <article className="stay-list-card">
      <div className="stay-list-card__topline">
        <span
          className={`stay-list-card__status${stay.status === 'CANCELLED' ? ' stay-list-card__status--cancelled' : ''}`}
        >
          {stay.status === 'ACTIVE' ? '등록됨' : '취소됨'}
        </span>
        {!stay.property.isActive && (
          <span className="stay-list-card__inactive">비활성 휴양소</span>
        )}
      </div>
      <h2>{stay.guestName}</h2>
      <p className="stay-list-card__property">{stay.property.name}</p>
      <dl className="stay-list-card__details">
        <div>
          <dt>회사 · 부서</dt>
          <dd>
            {[stay.company, stay.department].filter(Boolean).join(' · ') ||
              '미등록'}
          </dd>
        </div>
        <div>
          <dt>연락처</dt>
          <dd>{stay.phone || '미등록'}</dd>
        </div>
      </dl>
      <dl className="stay-list-card__period">
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
      <Link
        className="stay-list-card__detail"
        to={detailHref}
        aria-label={`${stay.guestName}, ${stay.property.name} 이용 일정 상세 보기`}
      >
        상세 보기 <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
