import { useEffect, useId, useRef } from 'react';
import { Button } from '../../../../shared/ui/Button/Button';

export function StayLinkNavigationNotice({ onKeep, onProceed }: {
  onKeep: () => void;
  onProceed: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const title = useId();
  const description = useId();
  useEffect(() => { panel.current?.focus(); }, []);
  return (
    <div className="stay-banner" ref={panel} tabIndex={-1}
      role="alertdialog" aria-labelledby={title} aria-describedby={description}>
      <h2 id={title}>발급한 링크를 보관하셨나요?</h2>
      <p id={description}>
        계속하면 이 화면에 표시된 개인 이용 링크 주소가 사라집니다.
        저장된 주소를 다시 조회할 수 없으므로 먼저 복사해 주세요.
      </p>
      <div className="stay-heading__actions">
        <Button onClick={onKeep}>돌아가서 링크 복사</Button>
        <Button className="admin-button-secondary" onClick={onProceed}>보관했어요 · 계속</Button>
      </div>
    </div>
  );
}
