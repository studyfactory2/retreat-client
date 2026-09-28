import { Link } from 'react-router-dom';
import type { AdminStayDto } from '../../../../features/admin-stays/admin-stays.types';

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function StayDetails({ stay }: { stay: AdminStayDto }) {
  return (
    <section
      className="stay-card stay-details"
      aria-label="이용 일정 상세 정보"
    >
      <dl>
        <div>
          <dt>휴양소</dt>
          <dd>
            {stay.property.name}
            {!stay.property.isActive && ' · 비활성'}
          </dd>
        </div>
        <div>
          <dt>상태</dt>
          <dd>{stay.status === 'ACTIVE' ? '등록됨' : '취소됨'}</dd>
        </div>
        <div>
          <dt>이용객 이름</dt>
          <dd>{stay.guestName}</dd>
        </div>
        <div>
          <dt>연락처</dt>
          <dd>{stay.phone ?? '—'}</dd>
        </div>
        <div>
          <dt>회사</dt>
          <dd>{stay.company ?? '—'}</dd>
        </div>
        <div>
          <dt>부서</dt>
          <dd>{stay.department ?? '—'}</dd>
        </div>
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
        <div className="stay-details__wide">
          <dt>관리자 메모</dt>
          <dd>{stay.notes ?? '—'}</dd>
        </div>
        <div>
          <dt>등록 방식</dt>
          <dd>{stay.source === 'MANUAL' ? '직접 등록' : '엑셀 등록'}</dd>
        </div>
        <div>
          <dt>등록 관리자</dt>
          <dd>{stay.createdBy.name}</dd>
        </div>
        {stay.status === 'CANCELLED' && (
          <div className="stay-details__wide">
            <dt>취소 사유</dt>
            <dd>{stay.cancellationReason ?? '—'}</dd>
          </div>
        )}
      </dl>
      <p className="stay-details__note">
        모든 시간은 한국 시간 기준입니다. 등록된 일정은 실제 입·퇴실 여부를
        의미하지 않습니다.
      </p>
      <Link
        className="ui-button admin-button-secondary"
        to={`/admin/submissions?stayId=${stay.id}`}
      >
        연결된 체크리스트 보기
      </Link>
    </section>
  );
}
