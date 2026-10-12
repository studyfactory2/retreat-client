import { useId, useLayoutEffect, useRef } from 'react';
import { Button } from '../../../shared/ui/Button/Button';
import './navigation-guard.css';

export function NavigationLeaveDialog({
  restoring,
  admin = false,
  loggingOut = false,
  onStay,
  onLeave,
}: {
  restoring: boolean;
  admin?: boolean;
  loggingOut?: boolean;
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
      <h2 id={titleId}>
        {loggingOut ? '로그아웃할까요?' : '작성 화면을 떠날까요?'}
      </h2>
      <p id={descriptionId}>
        {admin
          ? '저장하지 않은 변경 사항, 처리 결과를 확인하지 못한 작업 또는 새로 발급된 링크가 있습니다. 이동하면 입력 내용과 발급된 링크가 사라질 수 있습니다. 필요한 링크는 먼저 복사해 주세요. 이동해도 이미 요청한 저장은 취소되지 않습니다.'
          : '저장하지 않은 입력이나 아직 올리지 않은 사진, 처리 중이거나 결과를 확인하지 못한 작업이 있습니다. 이동하면 입력과 파일 선택이 사라질 수 있습니다. 다시 열 때 체크리스트와 사진의 저장 상태를 확인해 주세요.'}
      </p>
      <div className="navigation-leave-actions">
        <Button autoFocus disabled={restoring} onClick={onStay}>
          계속 작성
        </Button>
        <Button disabled={restoring} onClick={onLeave}>
          {loggingOut ? '로그아웃' : '이동하기'}
        </Button>
      </div>
      {restoring && <p role="status">작성 화면으로 돌아가고 있습니다.</p>}
    </dialog>
  );
}
