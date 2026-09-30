import { useEffect, useId, useRef } from 'react';
import type { AdminIssueCategoryDto } from '../../../../features/admin-issue-categories/admin-issue-category.types';
import { FALLBACK_CATEGORY_NAME } from '../../../../features/admin-issue-categories/admin-issue-category-validation';
import { Button } from '../../../../shared/ui/Button/Button';
import type { CategoryFormValues } from '../model/issue-category-model';
import '../styles/issue-categories.css';

export function CategoryReview({
  values,
  original,
  onBack,
  onConfirm,
  busy,
  disabled = false,
}: {
  values: CategoryFormValues;
  original?: AdminIssueCategoryDto;
  onBack: () => void;
  onConfirm: () => void;
  busy: boolean;
  disabled?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const active = original ? values.isActive : true;
  const deactivating = !!original?.isActive && !active;
  useEffect(() => {
    panel.current?.focus();
  }, []);
  return (
    <div
      className="category-banner category-banner--review"
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      ref={panel}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !busy) {
          event.preventDefault();
          onBack();
        }
      }}
    >
      <p className="category-eyebrow">저장 전 확인</p>
      <h2 id={titleId}>
        {!original
          ? '새 분류를 등록할까요?'
          : deactivating
            ? '분류를 비활성화할까요?'
            : '분류 변경을 저장할까요?'}
      </h2>
      <p id={descriptionId}>
        이 분류는 모든 휴양소가 함께 사용합니다. 아래 내용이 공통 분류 목록에
        반영됩니다.
      </p>
      <dl className="category-review__values">
        <div>
          <dt>분류명</dt>
          <dd>{values.name.trim()}</dd>
        </div>
        <div>
          <dt>표시 순서</dt>
          <dd>{Number(values.sortOrder).toLocaleString('ko-KR')}</dd>
        </div>
        <div>
          <dt>저장 후 상태</dt>
          <dd>{active ? '활성' : '비활성'}</dd>
        </div>
      </dl>
      {deactivating ? (
        <p className="category-review__impact">
          비활성화하면 이용객의 새로운 이상사항 신고에서 이 분류를 선택할 수
          없습니다. 기존 이상사항과 당시 저장된 분류명은 유지됩니다.
        </p>
      ) : (
        <p className="category-review__impact">
          이전에 접수된 이상사항과 기록에 저장된 당시 분류명은 변경되지
          않습니다.
        </p>
      )}
      {!original && values.name.trim() === FALLBACK_CATEGORY_NAME && (
        <p>
          기타는 기본 분류로 등록되며, 등록 후 이름 변경과 비활성화가
          제한됩니다.
        </p>
      )}
      <div className="category-actions">
        <Button
          className="admin-button-secondary"
          disabled={busy}
          onClick={onBack}
        >
          내용 다시 확인
        </Button>
        <Button loading={busy} disabled={disabled} onClick={onConfirm}>
          {!original
            ? '분류 등록'
            : deactivating
              ? '비활성화 저장'
              : '변경 저장'}
        </Button>
      </div>
    </div>
  );
}
