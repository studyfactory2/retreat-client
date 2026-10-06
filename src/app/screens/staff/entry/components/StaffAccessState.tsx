import { Button } from '../../../../shared/ui/Button/Button';
import { StaffIcon } from './StaffIcon';

export function StaffAccessState({
  state,
  message,
  onRetry,
}: {
  state: 'missing' | 'malformed' | 'loading' | 'unavailable' | 'request';
  message?: string;
  onRetry?: () => void;
}) {
  const loading = state === 'loading';
  const title = loading
    ? '직원 안내를 불러오고 있습니다'
    : state === 'missing'
      ? '직원용 QR이 필요합니다'
      : state === 'malformed'
        ? '직원용 링크를 확인해 주세요'
        : state === 'unavailable'
          ? '이 QR로 직원 안내를 열 수 없습니다'
          : '직원 안내를 불러오지 못했습니다';
  return (
    <section
      className="staff-entry-card staff-entry-state"
      role={loading ? 'status' : 'alert'}
    >
      <div
        className={`staff-entry-state__icon${loading ? ' staff-entry-state__icon--loading' : ''}`}
      >
        <StaffIcon name={loading ? 'refresh' : 'notice'} />
      </div>
      <h1>{title}</h1>
      <p>
        {loading
          ? '잠시만 기다려 주세요.'
          : message ||
            '현장의 직원용 QR을 다시 스캔하거나 전달받은 링크 전체를 열어 주세요. 확인이 어려우면 관리자에게 문의해 주세요.'}
      </p>
      {onRetry && <Button onClick={onRetry}>다시 확인</Button>}
    </section>
  );
}
