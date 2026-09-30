import { useEffect, useRef } from 'react';
import { Button } from '../../../../shared/ui/Button/Button';

export function QrNavigationNotice({
  action,
  onKeep,
  onProceed,
}: {
  action: 'return' | 'refresh';
  onKeep: () => void;
  onProceed: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panel.current?.focus();
  }, []);
  return (
    <div
      className="property-qr-notice"
      ref={panel}
      tabIndex={-1}
      role="alertdialog"
      aria-labelledby="qr-leave-title"
      aria-describedby="qr-leave-description"
    >
      <h2 id="qr-leave-title">발급한 QR을 보관하셨나요?</h2>
      <p id="qr-leave-description">
        {action === 'return'
          ? '이 화면을 떠나면 보관 중인 QR 주소가 사라지며 다시 조회할 수 없습니다. 필요한 주소나 이미지를 먼저 보관해 주세요.'
          : '최신 상태에서 발급 시각이 달라졌거나 휴양소가 비활성이면 현재 보관 중인 QR 주소가 화면에서 사라집니다. 발급 상태가 그대로인 주소는 유지됩니다.'}
      </p>
      <div className="property-qr-actions">
        <Button onClick={onKeep}>화면에 머무르기</Button>
        <Button className="admin-button-secondary" onClick={onProceed}>
          {action === 'return' ? '보관 완료 · 돌아가기' : '최신 상태 확인'}
        </Button>
      </div>
    </div>
  );
}
