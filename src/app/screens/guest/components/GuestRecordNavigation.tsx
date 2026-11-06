import type { guestDraftOrigin } from '../../../features/guest-entry/guest-draft-origin';
import { buildGuestViewLocation } from '../entry/model/guest-entry-model';
import { GuestNavigation, GuestReceiptNavigation } from './GuestNavigation';

export function GuestRecordNavigation({
  origin, token, page,
}: {
  origin: ReturnType<typeof guestDraftOrigin>;
  token: string;
  page: 'draft' | 'receipt' | 'submission';
}) {
  if (!origin && page === 'draft') return null;
  return (
    <div className="guest-record-navigation">
      {origin ? (
        <GuestNavigation
          home={buildGuestViewLocation(origin.kind, origin.hash, 'home')}
          guide={buildGuestViewLocation(origin.kind, origin.hash, 'guide')}
          report={origin.kind === 'qr' ? buildGuestViewLocation('qr', origin.hash, 'report') : undefined}
        />
      ) : page !== 'draft' && (
        <GuestReceiptNavigation hash={`#token=${token}`} page={page} />
      )}
    </div>
  );
}
