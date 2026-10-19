import { useRef, useState } from 'react';
import type { AdminPropertyOption } from '../../../../features/admin-properties/admin-properties.types';
import type { AdminMaintenanceInput } from '../../../../features/admin-maintenance/admin-maintenance.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { AdminPropertySelect } from '../../components/AdminPropertySelect';
import { ScheduleIcon } from '../../schedule/components/ScheduleIcon';
import {
  maintenanceFilterErrors,
  type MaintenanceFilterErrors,
} from '../model/maintenance-filters';

const views = [
  ['ALL', '전체'],
  ['COMPLETED', '제출 기록'],
  ['UNFINISHED', '미완료'],
] as const;

export function MaintenanceFilters({
  input, properties, propertiesLoading, propertyError, onApply, onReset,
  count, busy, onRefresh,
}: {
  input: AdminMaintenanceInput;
  properties?: AdminPropertyOption[];
  propertiesLoading: boolean;
  propertyError: boolean;
  onApply: (value: AdminMaintenanceInput) => void;
  onReset: () => void;
  count?: number;
  busy: boolean;
  onRefresh: () => void;
}) {
  const [draft, setDraft] = useState(input);
  const [submitted, setSubmitted] = useState(false);
  const initialInvalid = Object.keys(maintenanceFilterErrors(input)).length > 0;
  const [periodOpen, setPeriodOpen] = useState(initialInvalid);
  const form = useRef<HTMLFormElement>(null);
  const [nativeDateErrors, setNativeDateErrors] = useState<MaintenanceFilterErrors>({});
  const errors = { ...maintenanceFilterErrors(draft), ...nativeDateErrors };
  const showErrors = submitted || initialInvalid;
  const hasChanges = (['propertyId', 'view', 'dateField', 'from', 'to'] as const)
    .some((key) => draft[key] !== input[key]) || Object.keys(nativeDateErrors).length > 0;

  function apply(next: AdminMaintenanceInput) {
    setSubmitted(true);
    const dateErrors: MaintenanceFilterErrors = {};
    for (const field of ['from', 'to'] as const) {
      if (form.current?.querySelector<HTMLInputElement>(`[name="${field}"]`)?.validity.badInput)
        dateErrors[field] = '연도, 월, 일을 모두 올바르게 입력해 주세요.';
    }
    setNativeDateErrors(dateErrors);
    const nextErrors = { ...maintenanceFilterErrors(next), ...dateErrors };
    if (Object.keys(nextErrors).length) {
      setPeriodOpen(true);
      const key = Object.keys(nextErrors)[0];
      requestAnimationFrame(() => form.current?.querySelector<HTMLElement>(
        key === 'view'
          ? '#maintenance-view-ALL'
          : `[id="maintenance-${key === 'propertyId' ? 'property' : key}"]`,
      )?.focus());
      return;
    }
    onApply({ ...next, page: 1 });
  }
  function quickFilter(key: 'propertyId' | 'view', value: string) {
    const next = { ...draft, [key]: value || undefined, page: 1 };
    setDraft(next);
    apply(next);
  }
  function changeDate(key: 'from' | 'to', element: HTMLInputElement) {
    setDraft((current) => ({ ...current, [key]: element.value || undefined, page: 1 }));
    const badInput = element.validity.badInput;
    setNativeDateErrors((current) => {
      const next = { ...current };
      if (badInput) next[key] = '연도, 월, 일을 모두 올바르게 입력해 주세요.';
      else delete next[key];
      return next;
    });
  }
  const fieldError = (key: keyof typeof errors) => showErrors && errors[key] ? (
    <span id={`maintenance-${key}-error`} className="maintenance-field-error">{errors[key]}</span>
  ) : null;

  return (
    <form ref={form} id="maintenance-filters" className="maintenance-filters"
      aria-label="청소·정비 조회 조건" noValidate onReset={onReset}
      onSubmit={(event) => { event.preventDefault(); apply(draft); }}>
      <div className="maintenance-view-tabs" role="group" aria-label="기록 구분">
        {views.map(([value, label]) => (
          <button key={value} id={`maintenance-view-${value}`} type="button"
            aria-pressed={draft.view === value}
            aria-describedby={showErrors && errors.view ? 'maintenance-view-error' : undefined}
            onClick={() => quickFilter('view', value)}>{label}</button>
        ))}
      </div>
      {fieldError('view')}
      <div className="maintenance-toolbar">
        <div className="maintenance-field maintenance-field--property">
          <AdminPropertySelect id="maintenance-property" value={draft.propertyId ?? ''}
            properties={properties} loading={propertiesLoading}
            onChange={(value) => quickFilter('propertyId', value)}
            invalid={showErrors && !!errors.propertyId}
            describedBy={[
              showErrors && errors.propertyId ? 'maintenance-propertyId-error' : undefined,
              propertyError ? 'maintenance-property-error' : undefined,
            ].filter(Boolean).join(' ') || undefined} />
          {fieldError('propertyId')}
        </div>
        <div className="maintenance-period">
          <button id="maintenance-period-toggle" type="button"
            className={input.from || input.to || input.dateField !== 'STARTED' ? 'is-filtered' : undefined}
            aria-expanded={periodOpen} aria-controls="maintenance-period-panel"
            onClick={() => setPeriodOpen((current) => !current)}>
            <ScheduleIcon name="calendar" /> 기간 <ScheduleIcon name="chevron" />
          </button>
        </div>
        <div className="maintenance-toolbar__result">
          <span role="status" aria-live="polite">
            {busy ? '조회 중' : count !== undefined ? <><strong>{count.toLocaleString('ko-KR')}</strong>건</> : '—'}
          </span>
          <Button type="button" className="maintenance-refresh" aria-label="정비 기록 새로고침"
            title="새로고침" disabled={busy} onClick={onRefresh}>
            <ScheduleIcon name="refresh" />
          </Button>
        </div>
      </div>
      <div id="maintenance-period-panel" className="maintenance-period__body" hidden={!periodOpen}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            setPeriodOpen(false);
            document.getElementById('maintenance-period-toggle')?.focus();
          }
        }}>
        <div className="maintenance-filters__fields">
          <div className="maintenance-field maintenance-field--basis">
            <label htmlFor="maintenance-dateField">날짜 기준</label>
            <select id="maintenance-dateField" name="dateField" value={draft.dateField}
              onChange={(event) => setDraft((current) => ({ ...current, dateField: event.target.value, page: 1 }))}
              aria-invalid={showErrors && !!errors.dateField}
              aria-describedby={showErrors && errors.dateField ? 'maintenance-dateField-error' : undefined}>
              {!['STARTED', 'SUBMITTED'].includes(draft.dateField) && <option value={draft.dateField}>날짜 기준 선택</option>}
              <option value="STARTED">작성 시작일</option>
              <option value="SUBMITTED">제출일</option>
            </select>
            {fieldError('dateField')}
          </div>
          {(['from', 'to'] as const).map((key) => (
            <div className="maintenance-field" key={key}>
              <label htmlFor={`maintenance-${key}`}>{key === 'from' ? '시작일' : '종료일'}</label>
              <input id={`maintenance-${key}`} name={key} type="date" min="1900-01-01" max="2100-12-31"
                value={draft[key] ?? ''}
                onChange={(event) => changeDate(key, event.currentTarget)}
                onInput={(event) => changeDate(key, event.currentTarget)}
                aria-invalid={showErrors && !!errors[key]}
                aria-describedby={`maintenance-date-hint${showErrors && errors[key] ? ` maintenance-${key}-error` : ''}`} />
              {fieldError(key)}
            </div>
          ))}
        </div>
        <div className="maintenance-filters__footer">
          <p id="maintenance-date-hint">한국 시간 · 최대 62일<br />날짜를 모두 비우면 전체 기간을 조회합니다.</p>
          <div className="maintenance-filters__actions">
            <Button id="maintenance-filter-reset" type="reset" className="admin-button-secondary">초기화</Button>
            <Button id="maintenance-filter-apply" type="submit">적용</Button>
          </div>
        </div>
      </div>
      {!initialInvalid && (input.from || input.to || input.dateField !== 'STARTED') && (
        <p className="maintenance-filter-summary">
          {input.dateField === 'SUBMITTED' ? '제출일' : '작성 시작일'} · {input.from && input.to ? `${input.from.replaceAll('-', '.')} – ${input.to.replaceAll('-', '.')}` : '전체 기간'}
        </p>
      )}
      {hasChanges && (
        <p className="maintenance-filters__pending" role="status">변경한 조건은 적용 후 반영됩니다.</p>
      )}
    </form>
  );
}
