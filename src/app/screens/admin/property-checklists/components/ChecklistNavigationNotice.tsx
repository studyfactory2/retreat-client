import { useEffect, useRef } from 'react';
import { Button } from '../../../../shared/ui/Button/Button';

export function ChecklistNavigationNotice({
  reload,
  onKeep,
  onProceed,
}: {
  reload: boolean;
  onKeep: () => void;
  onProceed: () => void;
}) {
  const notice = useRef<HTMLDivElement>(null);
  useEffect(() => {
    notice.current?.focus();
  }, []);
  return (
    <div
      className="checklist-banner"
      role="alertdialog"
      aria-labelledby="checklist-leave-title"
      aria-describedby="checklist-leave-description"
      tabIndex={-1}
      ref={notice}
    >
      <h2 id="checklist-leave-title">입력 내용을 버릴까요?</h2>
      <p id="checklist-leave-description">
        아직 확인되지 않은 입력 내용이 사라집니다.{' '}
        {reload
          ? '최신 저장 내용을 다시 불러옵니다.'
          : '체크리스트 목록으로 돌아갑니다.'}
      </p>
      <div className="checklist-actions">
        <Button className="admin-button-secondary" onClick={onKeep}>
          계속 확인하기
        </Button>
        <Button onClick={onProceed}>
          {reload ? '입력 버리고 다시 불러오기' : '입력 버리고 돌아가기'}
        </Button>
      </div>
    </div>
  );
}
