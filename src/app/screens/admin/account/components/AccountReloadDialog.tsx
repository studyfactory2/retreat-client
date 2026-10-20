import { useLayoutEffect, useRef } from 'react';
import { Button } from '../../../../shared/ui/Button/Button';

export function AccountReloadDialog({
  onKeep,
  onReload,
}: {
  onKeep: () => void;
  onReload: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="account-reload-dialog"
      aria-labelledby="account-reload-title"
      aria-describedby="account-reload-description"
      onCancel={(event) => {
        event.preventDefault();
        onKeep();
      }}
    >
      <h2 id="account-reload-title">최신 정보를 불러올까요?</h2>
      <p id="account-reload-description">
        작성 중인 내 정보와 비밀번호 입력이 초기화됩니다. 서버에 저장된 최신
        정보를 불러옵니다.
      </p>
      <div className="account-card__actions">
        <Button className="admin-button-secondary" autoFocus onClick={onKeep}>
          계속 작성
        </Button>
        <Button onClick={onReload}>다시 불러오기</Button>
      </div>
    </dialog>
  );
}
