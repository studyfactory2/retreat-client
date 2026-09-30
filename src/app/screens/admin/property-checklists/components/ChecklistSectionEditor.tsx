import { CHECKLIST_LIMITS } from '../../../../features/admin-checklist-templates/admin-checklist-template-validation';
import { Button } from '../../../../shared/ui/Button/Button';
import type { EditorSection } from '../model/checklist-form-model';

export function ChecklistSectionEditor({
  section,
  index,
  count,
  errors,
  disabled,
  canAddItem,
  onChange,
  onMove,
  onRemove,
  onAddItem,
  onMoveItem,
  onRemoveItem,
}: {
  section: EditorSection;
  index: number;
  count: number;
  errors: Record<string, string>;
  disabled: boolean;
  canAddItem: boolean;
  onChange: (section: EditorSection) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  onAddItem: () => void;
  onMoveItem: (key: string, direction: -1 | 1) => void;
  onRemoveItem: (key: string) => void;
}) {
  const sectionTitleId = `checklist-section-${section.key}`;
  const titleError = errors[`sections.${section.key}.title`];
  const itemsError = errors[`sections.${section.key}.items`];
  return (
    <section
      className="checklist-section-editor"
      aria-labelledby={`${sectionTitleId}-heading`}
    >
      <div className="checklist-section-editor__heading">
        <h3 id={`${sectionTitleId}-heading`}>
          <span>{String(index + 1).padStart(2, '0')}</span>점검 구역
        </h3>
        <div className="checklist-order-actions">
          <Button
            className="admin-button-secondary checklist-order-button"
            disabled={disabled || index === 0}
            aria-label={`구역 ${index + 1} 위로 이동`}
            onClick={() => onMove(-1)}
          >
            ↑
          </Button>
          <Button
            className="admin-button-secondary checklist-order-button"
            disabled={disabled || index === count - 1}
            aria-label={`구역 ${index + 1} 아래로 이동`}
            onClick={() => onMove(1)}
          >
            ↓
          </Button>
          <Button
            className="checklist-delete-button"
            disabled={disabled}
            aria-label={`구역 ${index + 1} 삭제`}
            onClick={onRemove}
          >
            구역 삭제
          </Button>
        </div>
      </div>
      <div className="checklist-field">
        <label htmlFor={sectionTitleId}>
          구역 {index + 1} 제목 <span>필수</span>
        </label>
        <input
          id={sectionTitleId}
          value={section.title}
          aria-required="true"
          aria-invalid={!!titleError}
          aria-describedby={`${sectionTitleId}-count${titleError ? ` ${sectionTitleId}-error` : ''}`}
          placeholder="예: 거실·주방"
          onChange={(event) =>
            onChange({ ...section, title: event.target.value })
          }
        />
        <p className="checklist-field__hint" id={`${sectionTitleId}-count`}>
          {[...section.title].length} / {CHECKLIST_LIMITS.sectionTitle}자
        </p>
        {titleError && (
          <p
            className="checklist-field__error"
            id={`${sectionTitleId}-error`}
            role="alert"
          >
            {titleError}
          </p>
        )}
      </div>
      <div className="checklist-section-editor__items-heading">
        <h4>점검 항목</h4>
        <span>
          {section.items.length} / {CHECKLIST_LIMITS.itemsPerSection}개
        </span>
      </div>
      {itemsError && (
        <p className="checklist-field__error" role="alert">
          {itemsError}
        </p>
      )}
      <ol className="checklist-item-editors">
        {section.items.map((item, itemIndex) => {
          const itemId = `checklist-item-${item.key}`;
          const itemError = errors[`items.${item.key}.label`];
          return (
            <li key={item.key} className="checklist-item-editor">
              <div className="checklist-item-editor__heading">
                <span>항목 {itemIndex + 1}</span>
                <div className="checklist-order-actions">
                  <Button
                    className="admin-button-secondary checklist-order-button"
                    disabled={disabled || itemIndex === 0}
                    aria-label={`구역 ${index + 1} 항목 ${itemIndex + 1} 위로 이동`}
                    onClick={() => onMoveItem(item.key, -1)}
                  >
                    ↑
                  </Button>
                  <Button
                    className="admin-button-secondary checklist-order-button"
                    disabled={
                      disabled || itemIndex === section.items.length - 1
                    }
                    aria-label={`구역 ${index + 1} 항목 ${itemIndex + 1} 아래로 이동`}
                    onClick={() => onMoveItem(item.key, 1)}
                  >
                    ↓
                  </Button>
                  <Button
                    className="checklist-delete-button"
                    disabled={disabled}
                    aria-label={`구역 ${index + 1} 항목 ${itemIndex + 1} 삭제`}
                    onClick={() => onRemoveItem(item.key)}
                  >
                    삭제
                  </Button>
                </div>
              </div>
              <div className="checklist-field">
                <label htmlFor={itemId}>
                  구역 {index + 1} · 항목 {itemIndex + 1} 문구 <span>필수</span>
                </label>
                <textarea
                  id={itemId}
                  rows={2}
                  value={item.label}
                  aria-required="true"
                  aria-invalid={!!itemError}
                  aria-describedby={`${itemId}-count${itemError ? ` ${itemId}-error` : ''}`}
                  placeholder="확인할 내용을 입력하세요"
                  onChange={(event) =>
                    onChange({
                      ...section,
                      items: section.items.map((current) =>
                        current.key === item.key
                          ? { ...current, label: event.target.value }
                          : current,
                      ),
                    })
                  }
                />
                <p className="checklist-field__hint" id={`${itemId}-count`}>
                  {[...item.label].length} / {CHECKLIST_LIMITS.itemLabel}자
                </p>
                {itemError && (
                  <p
                    className="checklist-field__error"
                    id={`${itemId}-error`}
                    role="alert"
                  >
                    {itemError}
                  </p>
                )}
              </div>
              <div className="checklist-item-editor__settings">
                <label>
                  <input
                    type="checkbox"
                    checked={item.required}
                    aria-label={`구역 ${index + 1} 항목 ${itemIndex + 1} 필수 응답`}
                    onChange={(event) =>
                      onChange({
                        ...section,
                        items: section.items.map((current) =>
                          current.key === item.key
                            ? { ...current, required: event.target.checked }
                            : current,
                        ),
                      })
                    }
                  />
                  필수 응답
                </label>
                <span>응답 방식: 정상 / 이상</span>
              </div>
            </li>
          );
        })}
      </ol>
      {section.items.length === 0 && (
        <p className="checklist-builder__empty">
          이 구역에 점검 항목을 추가해 주세요.
        </p>
      )}
      <Button
        className="admin-button-secondary checklist-add-item"
        disabled={disabled || !canAddItem}
        aria-label={`구역 ${index + 1}에 항목 추가`}
        onClick={onAddItem}
      >
        + 항목 추가
      </Button>
      {!canAddItem && (
        <p className="checklist-field__hint">
          구역당 최대 {CHECKLIST_LIMITS.itemsPerSection}개, 전체 최대{' '}
          {CHECKLIST_LIMITS.totalItems}개까지 등록할 수 있습니다.
        </p>
      )}
    </section>
  );
}
