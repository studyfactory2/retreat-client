import type {
  QrFlow,
  QrState,
} from '../../../../features/admin-property-qr/admin-property-qr.types';
import { qrStateLabel } from '../model/property-qr-model';

const dateFormat = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function QrFlowRow({
  flow,
  state,
  disabled,
  onSelect,
}: {
  flow: QrFlow;
  state: QrState;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        id={`qr-${flow}-select`}
        className="property-qr-row"
        aria-haspopup="dialog"
        disabled={disabled}
        onClick={onSelect}
      >
        <span className="property-qr-row__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h2v2h-2zM21 13v4M13 21h4M21 21h-2M3 12h3M12 3v3M12 10v3h4" />
          </svg>
        </span>
        <span className="property-qr-row__title">
          <strong>{flow === 'GUEST' ? '이용객 QR' : '직원 QR'}</strong>
          <span>
            {flow === 'GUEST' ? '입실 · 퇴실 · 이용 안내' : '청소 · 정비 점검'}
          </span>
        </span>
        <span className="property-qr-row__date">
          <span>최근 발급</span>
          {state.rotatedAt ? (
            <time dateTime={state.rotatedAt}>
              {dateFormat.format(new Date(state.rotatedAt))}
            </time>
          ) : (
            <span>발급 이력 없음</span>
          )}
        </span>
        <span
          className={`property-qr-card__badge${state.enabled ? ' property-qr-card__badge--active' : ''}`}
        >
          {qrStateLabel(state)}
        </span>
        <svg
          className="property-qr-row__arrow"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path d="m9 5 7 7-7 7" />
        </svg>
      </button>
    </li>
  );
}
