import { useEffect, useId, useRef } from 'react';
import type { ChecklistType } from '../../../../features/admin-checklist-templates/admin-checklist-template.types';
import { Button } from '../../../../shared/ui/Button/Button';
import '../styles/property-checklists.css';

export function ChecklistReview({
  creating,
  type,
  onBack,
  onConfirm,
  busy,
  disabled = false,
}: {
  creating: boolean;
  type: ChecklistType;
  onBack: () => void;
  onConfirm: () => void;
  busy: boolean;
  disabled?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const isGuest = type !== 'MAINTENANCE';
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
      <p className="checklist-eyebrow">저장 전 최종 확인</p>
      <h2 id={titleId}>
        {creating
          ? '이 구성으로 체크리스트를 만들까요?'
          : '정비 체크리스트 변경을 저장할까요?'}
      </h2>
      <p id={descriptionId}>
        {isGuest
          ? '입실·퇴실 체크리스트는 생성 후 제목, 구역, 항목, 필수 여부와 활성 상태를 수정할 수 없습니다. 작성한 구성을 다시 확인한 뒤 생성해 주세요.'
          : creating
            ? '새 정비 체크리스트가 활성 상태로 생성됩니다. 생성 후 구성과 활성 상태를 변경할 수 있습니다.'
            : '변경한 구성은 이후 작성되는 체크리스트에 적용됩니다. 기존 기록에 보관된 체크리스트와 제출 내용은 변경되지 않습니다.'}
      </p>
      <div className="checklist-actions">
        <Button
          className="admin-button-secondary"
          disabled={busy}
          onClick={onBack}
        >
          내용 다시 확인
        </Button>
        <Button loading={busy} disabled={disabled} onClick={onConfirm}>
          {creating
            ? isGuest
              ? '수정 불가 확인 · 생성'
              : '체크리스트 생성'
            : '변경 저장'}
        </Button>
      </div>
    </div>
  );
}
