import type { GuestAccessKind } from '../../../../features/guest-entry/guest-entry.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { GuestIcon } from './GuestIcon';

export function GuestAccessState({ kind, state, message, onRetry }: {
  kind: GuestAccessKind;
  state: 'missing' | 'malformed' | 'loading' | 'unavailable' | 'request';
  message?: string;
  onRetry?: () => void;
}) {
  const loading = state === 'loading';
  const title = loading ? '이용 안내를 불러오고 있습니다'
    : state === 'missing' ? '이용 안내 링크가 필요합니다'
      : state === 'malformed' ? '안내 링크를 확인해 주세요'
        : state === 'unavailable' ? '이 링크로 안내를 열 수 없습니다'
          : '안내를 불러오지 못했습니다';
  return (
    <section className="guest-card guest-state" role={loading ? 'status' : 'alert'}>
      <div className={`guest-state__icon${loading ? ' guest-state__icon--loading' : ''}`}>
        <GuestIcon name={loading ? 'refresh' : 'notice'} />
      </div>
      <h1>{title}</h1>
      <p>{loading ? '잠시만 기다려 주세요.' : message || (
        state === 'request' ? '잠시 후 다시 확인해 주세요.'
          : kind === 'qr' ? '현장에 비치된 이용객 QR을 다시 스캔해 주세요.'
            : '전달받은 개인 이용 링크 전체를 다시 열어 주세요.'
      )}</p>
      {onRetry && <Button onClick={onRetry}>다시 확인</Button>}
    </section>
  );
}
