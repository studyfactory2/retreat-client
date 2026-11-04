import type { AdminStayDto } from '../../../../features/admin-stays/admin-stays.types';
import { StayDetailIcon } from './StayDetailIcon';

const day = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short',
});
const time = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function StayDetails({
  stay,
  onMore,
  disabled,
  expanded,
}: {
  stay: AdminStayDto;
  onMore: () => void;
  disabled: boolean;
  expanded: boolean;
}) {
  return (
    <section className="stay-summary" aria-label="이용 일정 요약">
      <div className="stay-summary__heading">
        <h2>{stay.property.name}</h2>
        <span
          className={`stay-details__status${stay.status === 'CANCELLED' ? ' stay-details__status--cancelled' : ''}`}
        >
          {stay.status === 'ACTIVE' ? '등록됨' : '취소됨'}
        </span>
      </div>
      {!stay.property.isActive && (
        <p className="stay-summary__inactive">비활성 휴양소</p>
      )}
      <p className="stay-summary__guest">
        <strong>{stay.guestName}</strong>
        <span>{stay.phone ?? '연락처 미등록'}</span>
      </p>
      <dl className="stay-summary__dates">
        {(
          [
            ['입실 예정', stay.checkInAt],
            ['퇴실 예정', stay.checkOutAt],
          ] as const
        ).map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              <time dateTime={value}>
                <span>{day.format(new Date(value))}</span>
                <strong>{time.format(new Date(value))}</strong>
              </time>
            </dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        className="stay-summary__more"
        onClick={onMore}
        disabled={disabled}
        aria-expanded={expanded}
        aria-controls={expanded ? 'stay-detail-panel' : undefined}
      >
        예약 정보 더보기 <StayDetailIcon name="chevron" />
      </button>
    </section>
  );
}

export function StayInformation({ stay }: { stay: AdminStayDto }) {
  return (
    <div className="stay-information">
      <dl>
        <div>
          <dt>이용객</dt>
          <dd>{stay.guestName}</dd>
        </div>
        <div>
          <dt>연락처</dt>
          <dd>{stay.phone ?? '미등록'}</dd>
        </div>
        <div>
          <dt>회사</dt>
          <dd>{stay.company ?? '미입력'}</dd>
        </div>
        <div>
          <dt>부서</dt>
          <dd>{stay.department ?? '미입력'}</dd>
        </div>
        {stay.notes && (
          <div className="stay-information__note">
            <dt>관리자 메모</dt>
            <dd>{stay.notes}</dd>
          </div>
        )}
        {stay.status === 'CANCELLED' && (
          <div className="stay-information__note">
            <dt>취소 사유</dt>
            <dd>{stay.cancellationReason ?? '—'}</dd>
          </div>
        )}
      </dl>
      <details className="stay-information__additional">
        <summary>등록 정보 · 일정 안내</summary>
        <dl>
          <div>
            <dt>등록 방식</dt>
            <dd>{stay.source === 'MANUAL' ? '직접 등록' : '엑셀 등록'}</dd>
          </div>
          <div>
            <dt>등록 관리자</dt>
            <dd>{stay.createdBy.name}</dd>
          </div>
        </dl>
        <p>
          한국 시간 기준입니다. 예정 일정은 실제 입·퇴실 여부를 의미하지
          않습니다.
        </p>
      </details>
    </div>
  );
}
