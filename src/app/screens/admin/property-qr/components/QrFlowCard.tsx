import type { QrFlow } from '../../../../features/admin-property-qr/admin-property-qr.types';

export function QrFlowCard({
  flow,
  selected,
  tabIndex,
  onFocus,
  disabled,
  onSelect,
}: {
  flow: QrFlow;
  selected: boolean;
  tabIndex: 0 | -1;
  onFocus: () => void;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      id={`qr-${flow}-select`}
      role="tab"
      className="property-qr-tab"
      aria-selected={selected}
      aria-controls="property-qr-preview"
      tabIndex={tabIndex}
      onFocus={onFocus}
      disabled={disabled}
      onClick={onSelect}
    >
      {flow === 'GUEST' ? '이용객' : '직원'}
    </button>
  );
}
