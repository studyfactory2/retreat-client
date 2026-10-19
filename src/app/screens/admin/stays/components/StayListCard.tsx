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

const datePartsFormatter = new Intl.DateTimeFormat('en', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

function getDateParts(value: string) {
  const parts = datePartsFormatter.formatToParts(new Date(value));
  return {
    year: parts.find((part) => part.type === 'year')?.value ?? '',
    month: parts.find((part) => part.type === 'month')?.value ?? '',
    day: parts.find((part) => part.type === 'day')?.value ?? '',
  };
}

export function StayListCard({
  stay,
  detailHref,
}: {
  stay: AdminStayDto;
  detailHref: string;
}) {
  const start = getDateParts(stay.checkInAt);
  const end = getDateParts(stay.checkOutAt);
  const showYear = start.year !== end.year;
  const startLabel = `${showYear ? `${start.year}. ` : ''}${start.month}.${start.day}`;
  const endLabel = `${showYear ? `${end.year}. ` : ''}${end.month}.${end.day}`;
  const affiliation = [stay.company, stay.department].filter(Boolean).join(' · ');

  return (
    <article className="stay-record">
      <div className="stay-record__guest">
        <span className="stay-record__avatar" aria-hidden="true">
          {[...stay.guestName][0]}
        </span>
        <div className="stay-record__identity">
          <p className="stay-record__name">{stay.guestName}</p>
          {affiliation && (
            <p className="stay-record__affiliation">{affiliation}</p>
          )}
        </div>
      </div>
      <div className="stay-record__property">
        <h3>{stay.property.name}</h3>
        {!stay.property.isActive && <span>비활성 휴양소</span>}
      </div>
      <details className="stay-record__period">
        <summary aria-label={`${startLabel}부터 ${endLabel}까지, 예정 시간 확인`}>
          <svg
            className="stay-record__calendar"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 11h18M8 15h.01M12 15h.01M16 15h.01M8 18h.01M12 18h.01" />
          </svg>
          <span>
            <time dateTime={stay.checkInAt}>{startLabel}</time>
            {' – '}
            <time dateTime={stay.checkOutAt}>{endLabel}</time>
          </span>
        </summary>
        <dl className="stay-record__times">
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
        <p className="stay-record__timezone">한국 시간 기준</p>
      </details>
      <span
        className={`stay-record__status${stay.status === 'CANCELLED' ? ' stay-record__status--cancelled' : ''}`}
      >
        {stay.status === 'ACTIVE' ? '등록됨' : '취소됨'}
      </span>
      <Link
        className="stay-record__detail"
        to={detailHref}
        aria-label={`${stay.guestName}, ${stay.property.name} 이용 일정 상세 보기`}
      >
        <span aria-hidden="true">→</span> 상세
      </Link>
    </article>
  );
}
