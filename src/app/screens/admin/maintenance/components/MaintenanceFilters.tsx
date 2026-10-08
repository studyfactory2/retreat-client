import { useRef, useState } from 'react';
import type { AdminPropertyOption } from '../../../../features/admin-properties/admin-properties.types';
import type { AdminMaintenanceInput } from '../../../../features/admin-maintenance/admin-maintenance.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { AdminPropertySelect } from '../../components/AdminPropertySelect';
import {
  maintenanceFilterErrors,
  type MaintenanceFilterErrors,
} from '../model/maintenance-filters';

const views = [
  ['ALL', '전체 기록'],
  ['UNFINISHED', '미완료'],
  ['COMPLETED', '제출된 기록'],
] as const;
export function MaintenanceFilters({
  input,
  properties,
  propertiesLoading,
  propertyError,
  onApply,
  onReset,
}: {
  input: AdminMaintenanceInput;
  properties?: AdminPropertyOption[];
  propertiesLoading: boolean;
  propertyError: boolean;
  onApply: (value: AdminMaintenanceInput) => void;
  onReset: () => void;
}) {
  const [draft, setDraft] = useState(input);
  const [submitted, setSubmitted] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const [nativeDateErrors, setNativeDateErrors] =
    useState<MaintenanceFilterErrors>({});
  const errors = { ...maintenanceFilterErrors(draft), ...nativeDateErrors };
  const initialInvalid = Object.keys(maintenanceFilterErrors(input)).length > 0;
  const showErrors = submitted || initialInvalid;
  const change = (key: keyof AdminMaintenanceInput, value: string) =>
    setDraft((current) => ({ ...current, [key]: value || undefined, page: 1 }));
  const fieldError = (key: keyof typeof errors) =>
    showErrors && errors[key] ? (
      <span id={`maintenance-${key}-error`} className="maintenance-field-error">
        {errors[key]}
      </span>
    ) : null;
  return (
    <form
      ref={form}
      id="maintenance-filters"
      className="maintenance-filters"
      aria-label="청소·정비 조회 조건"
      noValidate
      onReset={onReset}
      onSubmit={(event) => {
        event.preventDefault();
        const dateErrors: MaintenanceFilterErrors = {};
        for (const field of ['from', 'to'] as const) {
          if (
            form.current?.querySelector<HTMLInputElement>(`[name="${field}"]`)
              ?.validity.badInput
          )
            dateErrors[field] = '연도, 월, 일을 모두 올바르게 입력해 주세요.';
        }
        setNativeDateErrors(dateErrors);
        setSubmitted(true);
        const nextErrors = { ...maintenanceFilterErrors(draft), ...dateErrors };
        if (Object.keys(nextErrors).length) {
          const key = Object.keys(nextErrors)[0];
          requestAnimationFrame(() =>
            form.current
              ?.querySelector<HTMLElement>(
                `[id="maintenance-${key === 'propertyId' ? 'property' : key}"], [name="${key}"]`,
              )
              ?.focus(),
          );
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
          <AdminPropertySelect
            id="maintenance-property"
            value={draft.propertyId ?? ''}
            properties={properties}
            loading={propertiesLoading}
            onChange={(value) => change('propertyId', value)}
            invalid={showErrors && !!errors.propertyId}
            describedBy={
              [
                showErrors && errors.propertyId
                  ? 'maintenance-propertyId-error'
                  : undefined,
                propertiesLoading
                  ? 'maintenance-property-loading'
                  : propertyError
                    ? 'maintenance-property-error'
                    : undefined,
              ]
                .filter(Boolean)
                .join(' ') || undefined
            }
          />
          {fieldError('propertyId')}
        </div>
        <div className="maintenance-field maintenance-field--basis">
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
              min="1900-01-01"
              max="2100-12-31"
              value={draft[key] ?? ''}
              onChange={(event) => {
                change(key, event.target.value);
                const badInput = event.target.validity.badInput;
                setNativeDateErrors((current) => {
                  const next = { ...current };
                  if (badInput)
                    next[key] = '연도, 월, 일을 모두 올바르게 입력해 주세요.';
                  else delete next[key];
                  return next;
                });
              }}
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
            한국 시간 · 날짜를 모두 비우면 전체 기간, 입력하면 최대 62일
          </p>
          <p>
            {draft.view === 'UNFINISHED'
              ? '기한 만료·접근 불가·확인 필요도 포함합니다. 작성 시작일로 조회해 주세요.'
              : draft.view === 'COMPLETED'
                ? '제출된 기록에도 확인 필요 상태가 포함될 수 있습니다.'
                : '작성 중인 기록과 제출된 기록을 함께 표시합니다.'}
          </p>
          {propertiesLoading && (
            <p id="maintenance-property-loading" role="status">
              휴양소 선택 목록을 불러오고 있습니다.
            </p>
          )}
        </div>
        <div className="maintenance-filters__actions">
          <Button
            id="maintenance-filter-reset"
            type="reset"
            className="admin-button-secondary"
          >
            초기화
          </Button>
          <Button type="submit">조회</Button>
        </div>
      </div>
    </form>
  );
}
