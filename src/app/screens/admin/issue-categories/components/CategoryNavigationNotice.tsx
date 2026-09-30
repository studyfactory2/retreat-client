import { useEffect, useId, useRef } from 'react';
import { Button } from '../../../../shared/ui/Button/Button';
import '../styles/issue-categories.css';

export function CategoryNavigationNotice({
  reload,
  onKeep,
  onProceed,
}: {
  reload: boolean;
  onKeep: () => void;
  onProceed: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    panel.current?.focus();
  }, []);
  return (
    <div
      className="category-banner"
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      tabIndex={-1}
      ref={panel}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onKeep();
        }
      }}
    >
      <h2 id={titleId}>입력한 분류 정보를 버릴까요?</h2>
      <p id={descriptionId}>
        현재 입력한 이름, 표시 순서와 활성 설정이 사라집니다.{' '}
        {reload
          ? '서버에 저장된 최신 분류 정보를 다시 불러옵니다.'
          : '분류 목록으로 돌아갑니다.'}
      </p>
      <div className="category-actions">
        <Button className="admin-button-secondary" onClick={onKeep}>
          계속 작성하기
        </Button>
        <Button onClick={onProceed}>
          {reload ? '입력 버리고 다시 불러오기' : '입력 버리고 돌아가기'}
        </Button>
      </div>
    </div>
  );
}
