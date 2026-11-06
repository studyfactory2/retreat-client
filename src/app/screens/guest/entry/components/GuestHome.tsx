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
  accessCard,
}: {
  entry: GuestEntryContext;
  guide: To;
  checkIn: To;
  checkOut: To;
  report?: To;
  vehicleCard?: ReactNode;
  accessCard?: ReactNode;
}) {
  return (
    <div className="guest-home">
      <GuestHomeHeader entry={entry} />
      <div className="guest-home-columns">
        <div className="guest-home-column">
          {entry.kind === 'stay' && accessCard}
          <GuestHomeChecklists
            checklists={entry.context.checklists}
            checkIn={checkIn}
            checkOut={checkOut}
          />
        </div>
        <div className="guest-home-column">
          <section
            className="guest-home-resources"
            aria-labelledby="guest-resources-title"
          >
            <h2 id="guest-resources-title">이용 안내</h2>
            <Link className="guest-home-resource" to={guide}>
              <GuestIcon name="guide" />
              <span>휴양소 안내</span>
              <GuestIcon name="arrow" />
            </Link>
            {entry.kind === 'stay' &&
              entry.context.property.vehicleRegistrationEnabled &&
              vehicleCard}
            {entry.kind === 'qr' && report && (
              <Link className="guest-home-resource" to={report} reloadDocument>
                <GuestIcon name="notice" />
                <span>불편 신고</span>
                <GuestIcon name="arrow" />
              </Link>
            )}
            <GuestManagerContact
              phone={entry.context.property.publicContactPhone}
            />
            <p className="guest-home-note">
              {entry.kind === 'qr'
                ? '예약 일정은 개인 이용 링크에서 확인해 주세요.'
                : '불편 신고는 현장의 이용객 QR을 스캔해 주세요.'}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
