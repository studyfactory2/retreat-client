import { useEffect, useRef } from 'react';
import { Button } from '../../../shared/ui/Button/Button';

export function UnsavedStayNotice({
  onKeep,
  onDiscard,
}: {
  onKeep: () => void;
  onDiscard: () => void;
}) {
  const notice = useRef<HTMLDivElement>(null);
  useEffect(() => {
    notice.current?.focus();
  }, []);
  return (
    <div
      className="stay-banner"
      role="alertdialog"
      aria-labelledby="stay-discard-title"
      aria-describedby="stay-discard-description"
      tabIndex={-1}
      ref={notice}
    >
      <h2 id="stay-discard-title">입력 내용을 버릴까요?</h2>
      <p id="stay-discard-description">
        아직 저장하지 않은 입력 내용이 사라집니다.
      </p>
      <div className="stay-heading__actions">
        <Button onClick={onKeep}>계속 작성</Button>
        <Button className="admin-button-secondary" onClick={onDiscard}>
          입력 버리기
        </Button>
      </div>
    </div>
  );
}
