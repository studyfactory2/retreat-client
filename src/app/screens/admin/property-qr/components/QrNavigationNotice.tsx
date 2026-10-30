import { useEffect, useRef } from 'react';
import { Button } from '../../../../shared/ui/Button/Button';

export function QrNavigationNotice({
  onKeep,
  onProceed,
}: {
  onKeep: () => void;
  onProceed: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panel.current?.focus();
  }, []);
  return (
    <div
      ref={panel}
      tabIndex={-1}
      className="property-qr-notice"
      role="alertdialog"
      aria-labelledby="qr-navigation-title"
      aria-describedby="qr-navigation-description"
    >
      <h2 id="qr-navigation-title">QR을 보관하셨나요?</h2>
      <p id="qr-navigation-description">
        이 주소는 다시 열 수 없습니다. 계속하면 현재 표시된 주소가 닫힙니다.
        링크를 복사하거나 QR 이미지를 저장한 뒤 계속해 주세요.
      </p>
      <div className="property-qr-actions">
        <Button className="admin-button-secondary" onClick={onKeep}>
          계속 확인
        </Button>
        <Button onClick={onProceed}>보관했어요 · 계속</Button>
      </div>
    </div>
  );
}
