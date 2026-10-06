import { useId, useLayoutEffect, useRef } from 'react';
import { Button } from '../../../shared/ui/Button/Button';
import './navigation-guard.css';

export function NavigationLeaveDialog({
  restoring,
  onStay,
  onLeave,
}: {
  restoring: boolean;
  onStay: () => void;
  onLeave: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useLayoutEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="navigation-leave-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        onStay();
      }}
    >
      <h2 id={titleId}>작성 화면을 떠날까요?</h2>
      <p id={descriptionId}>
        저장하지 않은 입력이나 확인하지 못한 저장 결과가 있습니다. 이동하면
        저장하지 않은 입력은 사라질 수 있습니다. 저장 중이거나 결과를 모르는
        경우, 다시 열어 저장 상태를 확인해 주세요.
      </p>
      <div className="navigation-leave-actions">
        <Button autoFocus disabled={restoring} onClick={onStay}>
          계속 작성
        </Button>
        <Button disabled={restoring} onClick={onLeave}>
          이동하기
        </Button>
      </div>
      {restoring && <p role="status">작성 화면으로 돌아가고 있습니다.</p>}
    </dialog>
  );
}
