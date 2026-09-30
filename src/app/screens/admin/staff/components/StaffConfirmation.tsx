import { useEffect, useRef } from 'react';
import { Button } from '../../../../shared/ui/Button/Button';
export function StaffConfirmation({
  mode,
  name,
  busy = false,
  onKeep,
  onConfirm,
}: {
  mode: 'discard' | 'deactivate';
  name?: string;
  busy?: boolean;
  onKeep: () => void;
  onConfirm: () => void;
}) {
  const notice = useRef<HTMLDivElement>(null);
  useEffect(() => {
    notice.current?.focus();
  }, []);
  return (
    <div
      className="staff-banner"
      role="alertdialog"
      tabIndex={-1}
      ref={notice}
      aria-labelledby="staff-confirm-title"
      aria-describedby="staff-confirm-description"
    >
      <h2 id="staff-confirm-title">
        {mode === 'discard'
          ? '입력 내용을 버릴까요?'
          : '직원을 비활성화할까요?'}
      </h2>
      <p id="staff-confirm-description">
        {mode === 'discard'
          ? '현재 입력한 내용이 사라집니다. 계속하면 선택한 화면의 최신 정보를 확인합니다.'
          : `${name ?? '이 직원'} 님을 비활성화하면 새로 담당 직원으로 배정할 수 없습니다. 기존 정비 기록은 유지되며, 입력한 다른 변경 사항도 함께 저장됩니다.`}
      </p>
      <div className="staff-actions">
        <Button
          className="admin-button-secondary"
          disabled={busy}
          onClick={onKeep}
        >
          계속 작성
        </Button>
        <Button disabled={busy} onClick={onConfirm}>
          {mode === 'discard' ? '입력 버리고 계속' : '비활성화하고 저장'}
        </Button>
      </div>
    </div>
  );
}
