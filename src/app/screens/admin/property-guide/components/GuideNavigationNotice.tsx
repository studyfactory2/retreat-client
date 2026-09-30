import { useEffect, useId, useRef } from 'react';
import { Button } from '../../../../shared/ui/Button/Button';
import '../styles/property-guide.css';

export function GuideNavigationNotice({
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
      className="property-guide-banner"
      ref={panel}
      tabIndex={-1}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onKeep();
        }
      }}
    >
      <h2 id={titleId}>현재 입력한 내용을 버릴까요?</h2>
      <p id={descriptionId}>
        화면에서 작성 중인 제목, 내용과 공개 설정이 사라집니다.{' '}
        {reload
          ? '서버에 저장된 최신 안내를 다시 불러옵니다.'
          : '휴양소 정보로 돌아갑니다.'}
      </p>
      <div className="property-guide-actions">
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
