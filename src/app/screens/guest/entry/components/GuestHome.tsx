import type { ReactNode } from 'react';
import { Link, type To } from 'react-router-dom';
import type { GuestEntryContext } from '../../../../features/guest-entry/guest-entry.types';
import { formatGuestStayTimestamp } from '../model/guest-entry-model';
import { GuestIcon } from './GuestIcon';

export function GuestHome({
  entry,
  guide,
  checkIn,
  checkOut,
  report,
  vehicleCard,
}: {
  entry: GuestEntryContext;
  guide: To;
  checkIn: To;
  checkOut: To;
  report?: To;
  vehicleCard?: ReactNode;
}) {
  const property = entry.context.property;
  return (
    <>
      <section className="guest-welcome" aria-labelledby="guest-home-title">
        <div className="guest-welcome__mark">
          <GuestIcon name="home" />
        </div>
        <p className="guest-eyebrow">{property.region || 'OH BOK RETREAT'}</p>
        <h1 id="guest-home-title">{property.name}</h1>
        <p className="guest-welcome__greeting">
          {entry.kind === 'stay'
            ? `${entry.context.guestName}님, 반갑습니다.`
            : '편안한 머무름을 준비해 보세요.'}
        </p>
        <p className="guest-welcome__description">
          휴양소 이용에 필요한 안내를 한곳에서 확인하세요.
        </p>
      </section>

      <section className="guest-check-actions" aria-label="입실·퇴실 체크">
        {(
          [
            {
              type: 'CHECK_IN',
              title: '입실 체크',
              description: '머무르기 전, 시설 상태를 확인해 주세요.',
              to: checkIn,
              icon: 'enter',
            },
            {
              type: 'CHECK_OUT',
              title: '퇴실 체크',
              description: '떠나기 전, 이용한 공간을 확인해 주세요.',
              to: checkOut,
              icon: 'leave',
            },
          ] as const
        ).map((action) => {
          const available = entry.context.checklists.some(
            (checklist) => checklist.type === action.type,
          );
          return available ? (
            <Link
              className={`guest-check-action${action.type === 'CHECK_IN' ? ' guest-check-action--primary' : ''}`}
              key={action.type}
              to={action.to}
            >
              <GuestIcon name={action.icon} />
              <span>
                <strong>{action.title}</strong>
                <small>{action.description}</small>
              </span>
              <GuestIcon name="arrow" />
            </Link>
          ) : (
            <div
              className="guest-check-action guest-check-action--unavailable"
              key={action.type}
            >
              <GuestIcon name={action.icon} />
              <span>
                <strong>{action.title}</strong>
                <small>체크리스트 준비 중 · 관리자에게 문의해 주세요.</small>
              </span>
            </div>
          );
        })}
      </section>
      {entry.kind === 'qr' && report && (
        <Link
          className="guest-check-action guest-check-action--report"
          to={report}
          reloadDocument
        >
          <GuestIcon name="notice" />
          <span>
            <strong>불편사항 신고</strong>
            <small>머무는 동안 발견한 문제를 알려주세요.</small>
          </span>
          <GuestIcon name="arrow" />
        </Link>
      )}
      <div className="guest-home-cards">
        {entry.kind === 'stay' && (
          <section
            className="guest-card guest-stay"
            aria-labelledby="guest-stay-title"
          >
            <div className="guest-card__heading">
              <h2 id="guest-stay-title">나의 이용 일정</h2>
              <span className="guest-badge">예정 일정</span>
            </div>
            <dl>
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
            <p className="guest-hint">
              한국 시간 기준 · 실제 입실·퇴실 완료 여부를 뜻하지 않습니다.
            </p>
          </section>
        )}
        <section
          className="guest-card guest-guide-card"
          aria-labelledby="guest-guide-card-title"
        >
          <div className="guest-guide-card__icon">
            <GuestIcon name="guide" />
          </div>
          <h2 id="guest-guide-card-title">휴양소 이용 안내</h2>
          <p>공간 이용 방법과 머무는 동안 알아둘 내용을 확인해 보세요.</p>
          <Link to={guide} className="guest-primary-link">
            안내 읽기
            <GuestIcon name="arrow" />
          </Link>
        </section>
      </div>
      {entry.kind === 'stay' &&
        entry.context.property.vehicleRegistrationEnabled &&
        vehicleCard}
      <aside className="guest-context-note">
        <GuestIcon name="notice" />
        <p>
          {entry.kind === 'qr'
            ? '이 QR은 휴양소 공용 안내입니다. 개인 이용 일정은 전달받은 개인 이용 링크에서 확인할 수 있습니다.'
            : '전달받은 개인 이용 링크에 연결된 일정입니다. 다시 방문할 때도 같은 링크를 열어 주세요.'}
        </p>
      </aside>
    </>
  );
}
