import type { ReactNode } from 'react';
import { Link, type To } from 'react-router-dom';
import type { GuestEntryContext } from '../../../../features/guest-entry/guest-entry.types';
import { GuestManagerContact } from '../../components/GuestManagerContact';
import { GuestHomeHeader } from './GuestHomeHeader';
import { GuestHomeChecklists } from './GuestHomeChecklists';
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
  return (
    <div className="guest-home">
      <GuestHomeHeader entry={entry} />
      <GuestHomeChecklists
        checklists={entry.context.checklists}
        checkIn={checkIn}
        checkOut={checkOut}
      />
      <section className="guest-home-resources" aria-label="이용 안내와 도움">
        <Link className="guest-home-resource" to={guide}>
          <span className="guest-home-resource__icon">
            <GuestIcon name="guide" />
          </span>
          <span>
            <strong>휴양소 이용 안내</strong>
            <small>시설 이용 방법과 안내사항</small>
          </span>
          <GuestIcon name="arrow" />
        </Link>
        {entry.kind === 'qr' && report && (
          <Link className="guest-home-resource" to={report} reloadDocument>
            <span className="guest-home-resource__icon">
              <GuestIcon name="notice" />
            </span>
            <span>
              <strong>불편사항 신고</strong>
              <small>고장이나 이용 중 불편을 알려주세요</small>
            </span>
            <GuestIcon name="arrow" />
          </Link>
        )}
      </section>
      <GuestManagerContact phone={entry.context.property.publicContactPhone} />
      {entry.kind === 'stay' &&
        entry.context.property.vehicleRegistrationEnabled &&
        vehicleCard}
      <p className="guest-home-note">
        {entry.kind === 'qr'
          ? '개인 이용 일정은 전달받은 개인 이용 링크에서 확인해 주세요.'
          : '다시 방문할 때도 전달받은 개인 이용 링크를 열어 주세요.'}
      </p>
    </div>
  );
}
