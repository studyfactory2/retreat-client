import { useEffect, useId, useRef, useState } from 'react';
import { CHECKLIST_LIMITS } from '../../../../features/admin-checklist-templates/admin-checklist-template-validation';
import { Button } from '../../../../shared/ui/Button/Button';
import {
  makeEditorItem,
  makeEditorSection,
  type ChecklistFormValues,
} from '../model/checklist-form-model';
import { ChecklistSectionEditor } from './ChecklistSectionEditor';
import '../styles/property-checklists.css';
import '../styles/checklist-editor.css';

type Removal = { sectionKey: string; itemKey?: string; label: string };

function moved<T>(items: T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length)
    return items;
  const next = [...items];
  [next[from], next[to]] = [next[to]!, next[from]!];
  return next;
}

export function ChecklistForm({
  values,
  onChange,
  errors,
  disabled,
}: {
  values: ChecklistFormValues;
  onChange: (values: ChecklistFormValues) => void;
  errors: Record<string, string>;
  disabled: boolean;
}) {
  const [removal, setRemoval] = useState<Removal | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const confirmation = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const removalTitleId = useId();
  const removalDescriptionId = useId();
  const totalItems = values.sections.reduce(
    (sum, section) => sum + section.items.length,
    0,
  );
  const fieldsDisabled = disabled || removal !== null;
  useEffect(() => {
    if (removal) confirmation.current?.focus();
  }, [removal]);

  function change(next: ChecklistFormValues) {
    if (!fieldsDisabled) onChange(next);
  }
  function performRemoval(target: Removal) {
    if (disabled) return;
    const nextSections = target.itemKey
      ? values.sections.map((section) =>
          section.key === target.sectionKey
            ? {
                ...section,
                items: section.items.filter(
                  (item) => item.key !== target.itemKey,
                ),
              }
            : section,
        )
      : values.sections.filter((section) => section.key !== target.sectionKey);
    onChange({ ...values, sections: nextSections });
    setRemoval(null);
    setAnnouncement(
      target.itemKey
        ? '점검 항목을 삭제했습니다.'
        : '점검 구역을 삭제했습니다.',
    );
    requestAnimationFrame(() =>
      document
        .getElementById(
          target.itemKey
            ? `checklist-section-${target.sectionKey}`
            : 'checklist-add-section',
        )
        ?.focus(),
    );
  }
  function requestRemoval(target: Removal) {
    if (fieldsDisabled) return;
    const section = values.sections.find(
      (entry) => entry.key === target.sectionKey,
    );
    if (!section) return;
    const item = target.itemKey
      ? section.items.find((entry) => entry.key === target.itemKey)
      : undefined;
    const hasContent = target.itemKey
      ? !!(item?.id || item?.label.trim() || item?.required === false)
      : !!(
          section.id ||
          section.title.trim() ||
          section.items.some(
            (entry) => entry.id || entry.label.trim() || !entry.required,
          )
        );
    if (!hasContent) return performRemoval(target);
    trigger.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setRemoval(target);
  }
  function cancelRemoval() {
    setRemoval(null);
    requestAnimationFrame(() => {
      if (trigger.current?.isConnected) trigger.current.focus();
    });
  }

  return (
    <div className="checklist-builder">
      <p className="checklist-visually-hidden" role="status" aria-live="polite">
        {announcement}
      </p>
      {removal && (
        <div
          className="checklist-banner checklist-banner--review"
          role="alertdialog"
          aria-labelledby={removalTitleId}
          aria-describedby={removalDescriptionId}
          tabIndex={-1}
          ref={confirmation}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !disabled) {
              event.preventDefault();
              cancelRemoval();
            }
          }}
        >
          <h2 id={removalTitleId}>
            {removal.itemKey
              ? '점검 항목을 삭제할까요?'
              : '점검 구역을 삭제할까요?'}
          </h2>
          <p className="checklist-builder__removal-label">{removal.label}</p>
          <p id={removalDescriptionId}>
            {removal.itemKey
              ? '이 항목의 입력 내용이 편집 화면에서 사라집니다.'
              : '이 구역과 구역 안의 모든 항목이 편집 화면에서 사라집니다.'}{' '}
            변경 사항은 체크리스트를 저장할 때 반영됩니다.
          </p>
          <div className="checklist-actions">
            <Button
              className="admin-button-secondary"
              disabled={disabled}
              onClick={cancelRemoval}
            >
              유지하기
            </Button>
            <Button disabled={disabled} onClick={() => performRemoval(removal)}>
              삭제하기
            </Button>
          </div>
        </div>
      )}
      <fieldset className="checklist-builder__fields" disabled={fieldsDisabled}>
        <legend className="checklist-visually-hidden">
          체크리스트 제목과 구역 구성
        </legend>
        <section className="checklist-builder__title-panel">
          <h2>체크리스트 기본 정보</h2>
          <div className="checklist-field">
            <label htmlFor={titleId}>
              체크리스트 제목 <span>필수</span>
            </label>
            <input
              id={titleId}
              value={values.title}
              aria-required="true"
              aria-invalid={!!errors.title}
              aria-describedby={`${titleId}-count${errors.title ? ` ${titleId}-error` : ''}`}
              placeholder="체크리스트 제목을 입력하세요"
              onChange={(event) =>
                change({ ...values, title: event.target.value })
              }
            />
            <p id={`${titleId}-count`} className="checklist-field__hint">
              {[...values.title].length} / {CHECKLIST_LIMITS.title}자
            </p>
            {errors.title && (
              <p
                className="checklist-field__error"
                role="alert"
                id={`${titleId}-error`}
              >
                {errors.title}
              </p>
            )}
          </div>
        </section>
        <div className="checklist-builder__section-heading">
          <div>
            <h2>구역별 점검 항목</h2>
            <p>구역과 항목의 순서는 위·아래 버튼으로 바꿀 수 있습니다.</p>
          </div>
          <span>
            구역 {values.sections.length}/{CHECKLIST_LIMITS.sections} · 전체
            항목 {totalItems}/{CHECKLIST_LIMITS.totalItems}
          </span>
        </div>
        {errors.sections && (
          <p className="checklist-field__error" role="alert">
            {errors.sections}
          </p>
        )}
        <div className="checklist-builder__sections">
          {values.sections.map((section, index) => (
            <ChecklistSectionEditor
              key={section.key}
              section={section}
              index={index}
              count={values.sections.length}
              errors={errors}
              disabled={fieldsDisabled}
              canAddItem={
                section.items.length < CHECKLIST_LIMITS.itemsPerSection &&
                totalItems < CHECKLIST_LIMITS.totalItems
              }
              onChange={(changed) =>
                change({
                  ...values,
                  sections: values.sections.map((entry) =>
                    entry.key === section.key ? changed : entry,
                  ),
                })
              }
              onMove={(direction) => {
                change({
                  ...values,
                  sections: moved(values.sections, index, index + direction),
                });
                setAnnouncement(
                  `구역 ${index + 1}을 ${index + direction + 1}번째로 이동했습니다.`,
                );
              }}
              onRemove={() =>
                requestRemoval({
                  sectionKey: section.key,
                  label: section.title.trim() || `구역 ${index + 1}`,
                })
              }
              onAddItem={() => {
                if (
                  section.items.length >= CHECKLIST_LIMITS.itemsPerSection ||
                  totalItems >= CHECKLIST_LIMITS.totalItems
                )
                  return;
                const item = makeEditorItem();
                change({
                  ...values,
                  sections: values.sections.map((entry) =>
                    entry.key === section.key
                      ? { ...entry, items: [...entry.items, item] }
                      : entry,
                  ),
                });
                requestAnimationFrame(() =>
                  document
                    .getElementById(`checklist-item-${item.key}`)
                    ?.focus(),
                );
              }}
              onMoveItem={(key, direction) => {
                const from = section.items.findIndex(
                  (item) => item.key === key,
                );
                change({
                  ...values,
                  sections: values.sections.map((entry) =>
                    entry.key === section.key
                      ? {
                          ...entry,
                          items: moved(entry.items, from, from + direction),
                        }
                      : entry,
                  ),
                });
                setAnnouncement(
                  `구역 ${index + 1}의 항목 ${from + 1}을 ${from + direction + 1}번째로 이동했습니다.`,
                );
              }}
              onRemoveItem={(key) =>
                requestRemoval({
                  sectionKey: section.key,
                  itemKey: key,
                  label:
                    section.items
                      .find((item) => item.key === key)
                      ?.label.trim() || '제목 없는 항목',
                })
              }
            />
          ))}
        </div>
        {values.sections.length === 0 && (
          <p className="checklist-builder__empty">
            첫 번째 점검 구역을 추가해 주세요.
          </p>
        )}
        <Button
          id="checklist-add-section"
          className="admin-button-secondary checklist-add-section"
          disabled={
            fieldsDisabled ||
            values.sections.length >= CHECKLIST_LIMITS.sections ||
            totalItems >= CHECKLIST_LIMITS.totalItems
          }
          onClick={() => {
            if (
              values.sections.length >= CHECKLIST_LIMITS.sections ||
              totalItems >= CHECKLIST_LIMITS.totalItems
            )
              return;
            const section = makeEditorSection();
            change({ ...values, sections: [...values.sections, section] });
            requestAnimationFrame(() =>
              document
                .getElementById(`checklist-section-${section.key}`)
                ?.focus(),
            );
          }}
        >
          + 점검 구역 추가
        </Button>
        <p className="checklist-field__hint">
          구역은 {CHECKLIST_LIMITS.sections}개, 구역별 항목은{' '}
          {CHECKLIST_LIMITS.itemsPerSection}개, 전체 항목은{' '}
          {CHECKLIST_LIMITS.totalItems}개까지 등록할 수 있습니다.
        </p>
      </fieldset>
    </div>
  );
}
