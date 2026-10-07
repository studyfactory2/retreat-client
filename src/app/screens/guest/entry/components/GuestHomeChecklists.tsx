import { Link, type To } from 'react-router-dom';
import type { GuestChecklistDto } from '../../../../features/guest-entry/guest-entry.types';
import { GuestIcon } from './GuestIcon';

export function GuestHomeChecklists({
  checklists,
  checkIn,
  checkOut,
}: {
  checklists: GuestChecklistDto[];
  checkIn: To;
  checkOut: To;
}) {
  return (
    <section
      className="guest-home-checklists"
      aria-labelledby="guest-check-title"
    >
      <h2 id="guest-check-title">입실·퇴실 체크</h2>
      <div className="guest-home-checklists__grid">
        {(
          [
            {
              type: 'CHECK_IN',
              title: '입실 체크',
              description: '이용 전 시설 확인',
              to: checkIn,
              icon: 'enter',
            },
            {
              type: 'CHECK_OUT',
              title: '퇴실 체크',
              description: '떠나기 전 마무리 확인',
              to: checkOut,
              icon: 'leave',
            },
          ] as const
        ).map((action) => {
          const available = checklists.some(
            (checklist) => checklist.type === action.type,
          );
          const content = (
            <>
              <GuestIcon name={action.icon} />
              <span>
                <strong>{action.title}</strong>
                <small>
                  {available ? action.description : '체크리스트 준비 중'}
                </small>
              </span>
              {available && <GuestIcon name="arrow" />}
            </>
          );
          return available ? (
            <Link
              className={`guest-home-check${action.type === 'CHECK_IN' ? ' guest-home-check--primary' : ''}`}
              key={action.type}
              to={action.to}
            >
              {content}
            </Link>
          ) : (
            <div
              className="guest-home-check guest-home-check--unavailable"
              key={action.type}
            >
              {content}
            </div>
          );
        })}
      </div>
      {checklists.length < 2 && (
        <p className="guest-home-checklists__hint">
          준비 중인 체크리스트는 관리자에게 문의해 주세요.
        </p>
      )}
    </section>
  );
}
