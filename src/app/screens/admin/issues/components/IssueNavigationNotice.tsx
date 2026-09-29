import { useEffect, useRef } from 'react';
import { Button } from '../../../../shared/ui/Button/Button';

export function IssueNavigationNotice({
  onKeep,
  onDiscard,
}: {
  onKeep: () => void;
  onDiscard: () => void;
}) {
  const prompt = useRef<HTMLElement>(null);
  useEffect(() => {
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    prompt.current?.focus();
    return () => {
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);
  return (
    <section
      className="issue-detail-discard"
      role="alertdialog"
      aria-labelledby="issue-discard-heading"
      ref={prompt}
      tabIndex={-1}
    >
      <h2 id="issue-discard-heading">작성 중인 내용을 비울까요?</h2>
      <p>
        입력한 메모는 보관되지 않습니다. 저장 결과를 확인 중이라면 최신 내용과
        처리 이력을 확인해 주세요.
      </p>
      <div className="issue-detail-actions">
        <Button className="admin-button-secondary" onClick={onKeep}>
          계속 작성
        </Button>
        <Button onClick={onDiscard}>입력 비우고 계속</Button>
      </div>
    </section>
  );
}
