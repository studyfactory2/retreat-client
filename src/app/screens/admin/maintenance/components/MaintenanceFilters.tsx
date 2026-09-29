import { useRef, useState } from 'react';
import type { AdminPropertyOption } from '../../../../features/admin-properties/admin-properties.types';
import type { AdminMaintenanceInput } from '../../../../features/admin-maintenance/admin-maintenance.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { maintenanceFilterErrors } from '../model/maintenance-filters';

const views = [
  ['ALL', '전체 기록'],
  ['UNFINISHED', '미완료'],
  ['COMPLETED', '제출된 기록'],
] as const;
export function MaintenanceFilters({
  input,
  properties,
  propertiesLoading,
  onApply,
}: {
  input: AdminMaintenanceInput;
  properties?: AdminPropertyOption[];
  propertiesLoading: boolean;
  onApply: (value: AdminMaintenanceInput) => void;
}) {
  const [draft, setDraft] = useState(input);
  const [submitted, setSubmitted] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const errors = maintenanceFilterErrors(draft);
  const initialInvalid = Object.keys(maintenanceFilterErrors(input)).length > 0;
  const showErrors = submitted || initialInvalid;
  const change = (key: keyof AdminMaintenanceInput, value: string) =>
    setDraft((current) => ({ ...current, [key]: value || undefined, page: 1 }));
  const missingProperty =
    draft.propertyId &&
    !properties?.some((item) => item.id === draft.propertyId);
  const fieldError = (key: keyof typeof errors) =>
    showErrors && errors[key] ? (
      <span id={`maintenance-${key}-error`} className="maintenance-field-error">
        {errors[key]}
      </span>
    ) : null;
  return (
    <form
      ref={form}
      className="maintenance-filters"
      aria-label="청소·정비 조회 조건"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
        if (Object.keys(errors).length) {
          const key = Object.keys(errors)[0];
          form.current?.querySelector<HTMLElement>(`[name="${key}"]`)?.focus();
          return;
        }
        onApply({ ...draft, page: 1 });
      }}
    >
      <fieldset className="maintenance-filters__views">
        <legend>조회할 기록</legend>
        <div>
          {views.map(([value, label]) => (
            <label
              key={value}
              className={draft.view === value ? 'is-selected' : ''}
            >
              <input
                type="radio"
                name="view"
                value={value}
                checked={draft.view === value}
                onChange={() => change('view', value)}
                aria-invalid={showErrors && !!errors.view}
                aria-describedby={
                  showErrors && errors.view
                    ? 'maintenance-view-error'
                    : undefined
                }
              />
              {label}
            </label>
          ))}
        </div>
        {fieldError('view')}
      </fieldset>
      <div className="maintenance-filters__fields">
        <div className="maintenance-field maintenance-field--property">
          <label htmlFor="maintenance-property">휴양소</label>
          <select
            id="maintenance-property"
            name="propertyId"
            value={draft.propertyId ?? ''}
            disabled={propertiesLoading}
            onChange={(event) => change('propertyId', event.target.value)}
            aria-invalid={showErrors && !!errors.propertyId}
            aria-describedby={
              showErrors && errors.propertyId
                ? 'maintenance-propertyId-error'
                : undefined
            }
          >
            <option value="">전체 휴양소</option>
            {missingProperty && (
              <option value={draft.propertyId}>
                {propertiesLoading
                  ? '선택한 휴양소 확인 중'
                  : '선택한 휴양소 · 목록에서 확인 불가'}
              </option>
            )}
            {properties?.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
                {property.isActive ? '' : ' · 비활성'}
              </option>
            ))}
          </select>
          {fieldError('propertyId')}
        </div>
        <div className="maintenance-field">
          <label htmlFor="maintenance-dateField">날짜 기준</label>
          <select
            id="maintenance-dateField"
            name="dateField"
            value={draft.dateField}
            onChange={(event) => change('dateField', event.target.value)}
            aria-invalid={showErrors && !!errors.dateField}
            aria-describedby={
              showErrors && errors.dateField
                ? 'maintenance-dateField-error'
                : undefined
            }
          >
            {!['STARTED', 'SUBMITTED'].includes(draft.dateField) && (
              <option value={draft.dateField}>잘못된 날짜 기준</option>
            )}
            <option value="STARTED">작성 시작일</option>
            <option value="SUBMITTED">제출일</option>
          </select>
          {fieldError('dateField')}
        </div>
        {(['from', 'to'] as const).map((key) => (
          <div className="maintenance-field" key={key}>
            <label htmlFor={`maintenance-${key}`}>
              {key === 'from' ? '조회 시작일' : '조회 종료일'}
            </label>
            <input
              id={`maintenance-${key}`}
              name={key}
              type="date"
              min={'1990-01-01'}
              max={'2100-12-31'}
              value={draft[key] ?? ''}
              onChange={(event) => change(key, event.target.value)}
              aria-invalid={showErrors && !!errors[key]}
              aria-describedby={`maintenance-date-hint${showErrors && errors[key] ? ` maintenance-${key}-error` : ''}`}
            />
            {fieldError(key)}
          </div>
        ))}
      </div>
      <div className="maintenance-filters__footer">
        <div>
          <p id="maintenance-date-hint">
            한국 시간 기준 · 날짜를 비우면 전체 기간, 기간 조회는 최대
            62일입니다.
          </p>
          <p>
            {draft.view === 'UNFINISHED'
              ? '기한 만료·접근 불가·확인 필요 기록도 포함합니다. 날짜 기준은 작성 시작일을 선택해 주세요.'
              : draft.view === 'COMPLETED'
                ? '제출된 기록에는 정비 완료와 확인 필요 기록이 함께 표시됩니다.'
                : '작성 중인 기록과 제출된 기록을 함께 확인합니다.'}
          </p>
          {propertiesLoading && (
            <p role="status">휴양소 선택 목록을 불러오고 있습니다.</p>
          )}
        </div>
        <div className="maintenance-filters__actions">
          <Button
            className="admin-button-secondary"
            onClick={() => {
              const defaults = { page: 1, dateField: 'STARTED', view: 'ALL' };
              setDraft(defaults);
              setSubmitted(false);
              onApply(defaults);
            }}
          >
            초기화
          </Button>
          <Button type="submit">조회</Button>
        </div>
      </div>
    </form>
  );
}
