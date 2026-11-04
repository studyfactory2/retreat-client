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

function Chevron({ right = false }: { right?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={right ? 'm9 6 6 6-6 6' : 'm6 9 6 6 6-6'} />
    </svg>
  );
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
  // This list spans all history: the year must remain visible for every stay.
  const startLabel = `${start.year}.${start.month}.${start.day}`;
  const endLabel = `${start.year !== end.year ? `${end.year}.` : ''}${end.month}.${end.day}`;
  const hasAffiliation = !!stay.company || !!stay.department;

  return (
    <article
      className="stay-record"
      aria-label={`${stay.property.name}, ${stay.guestName}`}
    >
      <div className="stay-record__headline">
        <div className="stay-record__property">
          <h3>{stay.property.name}</h3>
          {!stay.property.isActive && <span>비활성 휴양소</span>}
        </div>
        <span
          className={`stay-record__status${stay.status === 'CANCELLED' ? ' stay-record__status--cancelled' : ''}`}
        >
          {stay.status === 'ACTIVE' ? '등록됨' : '취소됨'}
        </span>
      </div>
      <div className="stay-record__meta">
        <span className="stay-record__name">{stay.guestName}</span>
        <details className="stay-record__period">
          <summary
            aria-label={`${startLabel}부터 ${endLabel}까지, 예정 시간${hasAffiliation ? ' 및 이용객 정보' : ''} 확인`}
          >
            <span className="stay-record__range">
              <time dateTime={stay.checkInAt}>{startLabel}</time>
              <span aria-hidden="true">–</span>
              <time dateTime={stay.checkOutAt}>{endLabel}</time>
            </span>
            <Chevron />
          </summary>
          <div className="stay-record__expanded">
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
              {stay.company && (
                <div>
                  <dt>회사</dt>
                  <dd>{stay.company}</dd>
                </div>
              )}
              {stay.department && (
                <div>
                  <dt>부서</dt>
                  <dd>{stay.department}</dd>
                </div>
              )}
            </dl>
            <p className="stay-record__timezone">한국 시간 기준</p>
          </div>
        </details>
      </div>
      <Link
        className="stay-record__detail"
        to={detailHref}
        aria-label={`${stay.guestName}, ${stay.property.name} 이용 일정 상세 보기`}
      >
        <Chevron right />
      </Link>
    </article>
  );
}
