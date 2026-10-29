import { useEffect, useId, useRef } from 'react';
import { Button } from '../../../../shared/ui/Button/Button';
import '../styles/property-checklists.css';

export function ChecklistReview({
  creating,
  nextVersion,
  active,
  onBack,
  onConfirm,
  busy,
  disabled = false,
}: {
  creating: boolean;
  nextVersion: number;
  active: boolean;
  onBack: () => void;
  onConfirm: () => void;
  busy: boolean;
  disabled?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    panel.current?.focus();
  }, []);
  return (
    <div
      className="checklist-banner checklist-banner--review"
      ref={panel}
      tabIndex={-1}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !busy) {
          event.preventDefault();
          onBack();
        }
      }}
    >
      <p className="checklist-eyebrow">저장 전 확인 · 버전 {nextVersion}</p>
      <h2 id={titleId}>
        {creating
          ? '이 구성으로 체크리스트를 만들까요?'
          : '새 버전으로 저장할까요?'}
      </h2>
      <p id={descriptionId}>
        {active
          ? '새로 시작하는 점검부터 이 구성을 사용합니다.'
          : '저장 후 새 점검을 시작할 수 없습니다.'}{' '}
        작성 중인 점검과 제출 기록은 유지됩니다.
      </p>
      <div className="checklist-actions">
        <Button
          className="admin-button-secondary"
          disabled={busy}
          onClick={onBack}
        >
          계속 수정
        </Button>
        <Button loading={busy} disabled={disabled} onClick={onConfirm}>
          {creating ? '체크리스트 만들기' : '새 버전 저장'}
        </Button>
      </div>
    </div>
  );
}
