import { useEffect, useRef } from 'react';
import type { QrFlow } from '../../../../features/admin-property-qr/admin-property-qr.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { qrFlowLabels } from '../model/property-qr-model';

export function QrConfirmation({
  flow,
  replacing,
  propertyName,
  onCancel,
  onConfirm,
}: {
  flow: QrFlow;
  replacing: boolean;
  propertyName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panel.current?.focus();
  }, []);
  return (
    <div
      className="property-qr-notice property-qr-notice--confirmation"
      ref={panel}
      tabIndex={-1}
      role="alertdialog"
      aria-labelledby="qr-confirm-title"
      aria-describedby="qr-confirm-description"
    >
      <p className="property-qr-notice__eyebrow">발급 전 확인</p>
      <h2 id="qr-confirm-title">
        {qrFlowLabels[flow]} QR을 {replacing ? '교체' : '발급'}할까요?
      </h2>
      <p>
        <strong>{propertyName}</strong> · {qrFlowLabels[flow]} QR
      </p>
      <p id="qr-confirm-description">
        {replacing
          ? `교체하면 이전 ${qrFlowLabels[flow]} QR 주소와 인쇄물은 즉시 무효화됩니다. 새 QR을 내려받은 뒤 기존 인쇄물을 교체해 주세요.`
          : '새 QR 주소는 발급 직후에만 확인할 수 있습니다. 발급 후 반드시 복사하거나 내려받아 보관해 주세요.'}{' '}
        {qrFlowLabels[flow === 'GUEST' ? 'STAFF' : 'GUEST']} QR은 변경되지
        않습니다.
      </p>
      <div className="property-qr-actions">
        <Button className="admin-button-secondary" onClick={onCancel}>
          돌아가기
        </Button>
        <Button onClick={onConfirm}>
          {replacing ? '이전 QR 무효화하고 교체' : 'QR 발급'}
        </Button>
      </div>
    </div>
  );
}
