import { useEffect, useId, useRef } from 'react';
import { Button } from '../../../../shared/ui/Button/Button';
import '../styles/property-guide.css';

export function PropertyGuideReview({
  isPublished,
  wasPublished,
  propertyActive,
  onBack,
  onConfirm,
  busy,
  disabled = false,
}: {
  isPublished: boolean;
  wasPublished: boolean;
  propertyActive: boolean;
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
  const impact = isPublished
    ? propertyActive
      ? wasPublished
        ? '저장하면 공개 중인 안내가 즉시 지금 작성한 제목과 내용으로 바뀝니다.'
        : '저장하면 지금 작성한 제목과 내용이 이용객에게 공개됩니다.'
      : '공개 상태로 저장되지만, 휴양소가 비활성인 동안 이용객은 이 안내에 접근할 수 없습니다.'
    : wasPublished
      ? '저장하면 현재 공개된 안내가 비공개로 전환되어 이용객에게 표시되지 않습니다. 작성한 내용은 관리자에게 저장됩니다.'
      : '작성한 내용을 비공개로 저장합니다. 이용객에게는 안내가 표시되지 않습니다.';
  return (
    <div
      className="property-guide-banner property-guide-banner--review"
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
      <p className="property-guide-eyebrow">저장 전 확인</p>
      <h2 id={titleId}>
        {isPublished
          ? wasPublished
            ? '공개 중인 안내를 변경할까요?'
            : '안내를 공개로 저장할까요?'
          : wasPublished
            ? '안내를 비공개로 전환할까요?'
            : '안내를 비공개로 저장할까요?'}
      </h2>
      <p id={descriptionId}>{impact}</p>
      <div className="property-guide-review__facts">
        <p>
          안내는 휴양소당 하나만 저장되며 별도의 공개본·초안이나 이전 내용
          보관함은 없습니다.
        </p>
        <p>저장해도 이용객에게 별도 알림을 보내지 않습니다.</p>
      </div>
      <div className="property-guide-actions">
        <Button
          className="admin-button-secondary"
          disabled={busy}
          onClick={onBack}
        >
          내용 다시 확인
        </Button>
        <Button loading={busy} disabled={disabled} onClick={onConfirm}>
          {isPublished ? '확인 · 공개로 저장' : '확인 · 비공개로 저장'}
        </Button>
      </div>
    </div>
  );
}
