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
    ? '작업을 불러오는 중이에요'
    : state === 'missing'
      ? '직원용 QR을 열어 주세요'
      : state === 'malformed'
        ? '직원용 링크를 확인해 주세요'
        : state === 'unavailable'
          ? '사용할 수 없는 직원 QR이에요'
          : '작업을 불러오지 못했어요';
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
      {!loading && (
        <p>
          {message ||
            '현장의 직원 QR을 스캔하거나 전달받은 직원용 링크를 열어 주세요.'}
        </p>
      )}
      {onRetry && <Button onClick={onRetry}>다시 확인</Button>}
    </section>
  );
}
