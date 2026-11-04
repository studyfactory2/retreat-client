import { useEffect, useId, useRef } from 'react';
import { Button } from '../../../../shared/ui/Button/Button';

export function StayDetailLeaveNotice({
  receipt,
  onKeep,
  onProceed,
}: {
  receipt: boolean;
  onKeep: () => void;
  onProceed: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div
      ref={ref}
      tabIndex={-1}
      className="stay-detail-leave"
      role="alertdialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
    >
      <h3 id={`${id}-title`}>
        {receipt ? '발급한 링크를 보관하셨나요?' : '현재 작업을 닫을까요?'}
      </h3>
      <p id={`${id}-description`}>
        {receipt
          ? '이 링크는 다시 조회할 수 없습니다. 먼저 복사해 주세요.'
          : '확인 중인 내용이 닫힙니다. 저장 결과가 불확실한 경우 다시 열어 최신 상태를 확인해 주세요. 이미 요청한 저장은 취소되지 않습니다.'}
      </p>
      <div>
        <Button onClick={onKeep}>
          {receipt ? '돌아가서 링크 복사' : '계속 확인'}
        </Button>
        <Button className="admin-button-secondary" onClick={onProceed}>
          {receipt ? '보관했어요 · 계속' : '닫고 계속'}
        </Button>
      </div>
    </div>
  );
}
