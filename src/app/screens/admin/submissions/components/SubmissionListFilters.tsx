import { useRef, useState } from 'react';
import type { AdminPropertyOption } from '../../../../features/admin-properties/admin-properties.types';
import type { AdminSubmissionListInput } from '../../../../features/admin-submissions/admin-submissions.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { AdminPropertySelect } from '../../components/AdminPropertySelect';
import {
  submissionFilterErrors,
  submissionTypeLabel,
  type SubmissionFilterErrors,
} from '../model/submission-list-model';
import '../styles/submission-filters.css';

type RecordType = 'ALL' | 'CHECK_IN' | 'CHECK_OUT' | 'MAINTENANCE';

export function SubmissionListFilters({
  input,
  properties,
  propertiesLoading,
  propertyError = false,
  urlErrors,
  onApply,
}: {
  input: AdminSubmissionListInput;
  properties?: AdminPropertyOption[];
  propertiesLoading: boolean;
  propertyError?: boolean;
  urlErrors?: SubmissionFilterErrors;
  onApply: (input: AdminSubmissionListInput) => void;
}) {
  const [values, setValues] = useState(input);
  const [errors, setErrors] = useState<SubmissionFilterErrors>(() => ({
    ...submissionFilterErrors(input),
    ...urlErrors,
  }));
  const [expanded, setExpanded] = useState(
    () => Object.keys({ ...submissionFilterErrors(input), ...urlErrors }).length > 0,
  );
  const form = useRef<HTMLFormElement>(null);
  const errorNotice = useRef<HTMLParagraphElement>(null);
  const selectedProperty = properties?.find((property) => property.id === input.propertyId);
  const propertySummary = input.propertyId
    ? selectedProperty?.name ?? '선택한 휴양소 · 확인 필요'
    : '전체 휴양소';
  const dateErrors = submissionFilterErrors(input);
  const formatDate = (date: string) => date.replaceAll('-', '.');
  const periodSummary = dateErrors.from || dateErrors.to || urlErrors?.from || urlErrors?.to
    ? '방문일 확인 필요'
    : input.from && input.to
      ? `${formatDate(input.from)} – ${formatDate(input.to)}`
      : input.from
        ? `${formatDate(input.from)} 이후`
        : input.to
          ? `${formatDate(input.to)} 이전`
          : '전체 기간';
  const activeCount = [input.propertyId, input.status, input.linkStatus, input.from || input.to]
    .filter(Boolean).length;
  const restrictionSummary = [
    input.status === 'SUBMITTED' ? '제출됨' : input.status === 'CANCELLED' ? '취소됨' : '',
    input.linkStatus === 'UNLINKED'
      ? '미연결'
      : input.linkStatus === 'LINKED'
        ? '연결됨'
        : input.linkStatus
          ? '연결 조건 확인 필요'
          : '',
  ].filter(Boolean).join(' · ');

  function showErrors(nextErrors: SubmissionFilterErrors) {
    setErrors(nextErrors);
    setExpanded(true);
    requestAnimationFrame(() => {
      const field = [...(form.current?.querySelectorAll<HTMLElement>('[aria-invalid="true"]') ?? [])]
        .find((element) => !element.matches(':disabled'));
      if (field) field.focus();
      else (errorNotice.current ?? form.current?.querySelector<HTMLElement>('#submission-filter-toggle'))?.focus();
    });
  }

  function apply() {
    const nextErrors = submissionFilterErrors(values);
    for (const field of ['from', 'to'] as const) {
      if (
        form.current?.querySelector<HTMLInputElement>(`#submission-${field}`)
          ?.validity.badInput
      )
        nextErrors[field] =
          '방문일의 연도, 월, 일을 모두 올바르게 입력해 주세요.';
    }
    if (Object.keys(nextErrors).length) {
      showErrors(nextErrors);
      return;
    }
    setErrors({});
    onApply({ ...values, stayId: input.stayId, page: 1 });
  }

  function selectType(type: RecordType) {
    // Type shortcuts use the applied query, never the other unsaved form fields.
    const next = { ...input, type: type === 'ALL' ? undefined : type, page: 1 };
    const unresolvedUrlErrors = { ...urlErrors };
    delete unresolvedUrlErrors.type;
    const nextErrors = { ...submissionFilterErrors(next), ...unresolvedUrlErrors };
    setValues(next);
    if (Object.keys(nextErrors).length) {
      showErrors(nextErrors);
      return;
    }
    setErrors({});
    onApply(next);
  }

  return (
    <form
      className="submission-filters"
      id="submission-filters"
      onReset={() => {
        const reset = { page: 1, stayId: input.stayId };
        setValues(reset);
        setErrors({});
        onApply(reset);
      }}
      noValidate
      ref={form}
      aria-label="제출 기록 조회 조건"
      onSubmit={(event) => {
        event.preventDefault();
        apply();
      }}
    >
      <fieldset className="submission-filters__types">
        <legend>기록 유형</legend>
        <div>
          {(['ALL', 'CHECK_IN', 'CHECK_OUT', 'MAINTENANCE'] as const).map((type) => (
            <label
              key={type}
              className={(values.type ?? 'ALL') === type ? 'is-selected' : ''}
            >
              <input
                id={`submission-type-${type}`}
                type="radio"
                name="submission-type"
                aria-invalid={!!errors.type || undefined}
                aria-describedby={errors.type ? 'submission-type-error' : undefined}
                value={type}
                checked={(values.type ?? 'ALL') === type}
                onChange={() => selectType(type)}
                onClick={() => {
                  if ((values.type ?? 'ALL') === type && errors.type) selectType(type);
                }}
              />
              <span>{type === 'ALL' ? '전체' : submissionTypeLabel[type]}</span>
            </label>
          ))}
        </div>
        {errors.type && (
          <p className="submission-field-error" id="submission-type-error">
            {errors.type}
          </p>
        )}
      </fieldset>
      <div className="submission-filters__panel">
        <button
          id="submission-filter-toggle"
          type="button"
          className="submission-filters__toggle"
          aria-expanded={expanded}
          aria-controls="submission-filter-fields"
          onClick={() => setExpanded((current) => !current)}
        >
          <span className="submission-filters__toggle-label">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h6m4 0h6M4 17h10m4 0h2" />
              <circle cx="12" cy="7" r="2" />
              <circle cx="16" cy="17" r="2" />
            </svg>
            조회 조건
            {activeCount > 0 && <span className="submission-filters__count">{activeCount}</span>}
          </span>
          <span className="submission-filters__summary">
            <span>{propertySummary}</span>
            <span>{periodSummary}</span>
            {restrictionSummary && <span>{restrictionSummary}</span>}
          </span>
          <svg className="submission-filters__chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="m5 7 5 5 5-5" />
          </svg>
        </button>
        <div id="submission-filter-fields" className="submission-filters__body" hidden={!expanded}>
          {errors.stayId && (
            <p className="submission-field-error" ref={errorNotice} role="alert" tabIndex={-1}>
              {errors.stayId}
            </p>
          )}
          <div className="submission-filters__fields">
            <div className="submission-filter-field submission-filter-field--property">
              <AdminPropertySelect
                id="submission-property"
                value={values.propertyId ?? ''}
                properties={properties}
                loading={propertiesLoading}
                onChange={(propertyId) => setValues((current) => ({ ...current, propertyId: propertyId || undefined }))}
                invalid={!!errors.propertyId}
                describedBy={[
                  errors.propertyId ? 'submission-property-error' : '',
                  propertyError ? 'submission-properties-error' : '',
                ].filter(Boolean).join(' ') || undefined}
              />
              {errors.propertyId && (
                <p className="submission-field-error" id="submission-property-error">{errors.propertyId}</p>
              )}
            </div>
            <div className="submission-filter-field">
              <label htmlFor="submission-status">기록 상태</label>
              <select
                id="submission-status"
                aria-invalid={!!errors.status || undefined}
                aria-describedby={errors.status ? 'submission-status-error' : undefined}
                value={values.status ?? ''}
                onChange={(event) => setValues((current) => ({
                  ...current,
                  status: event.target.value === 'SUBMITTED' || event.target.value === 'CANCELLED'
                    ? event.target.value : undefined,
                }))}
              >
                <option value="">전체 상태</option>
                <option value="SUBMITTED">제출됨</option>
                <option value="CANCELLED">취소됨</option>
              </select>
              {errors.status && (
                <p className="submission-field-error" id="submission-status-error">{errors.status}</p>
              )}
            </div>
            <div className="submission-filter-field">
              <label htmlFor="submission-link-status">일정 연결</label>
              <select
                id="submission-link-status"
                value={values.linkStatus ?? ''}
                onChange={(event) => setValues((current) => ({ ...current, linkStatus: event.target.value || undefined }))}
                aria-invalid={!!errors.linkStatus || undefined}
                aria-describedby={`submission-link-hint${errors.linkStatus ? ' submission-link-status-error' : ''}`}
              >
                <option value="">전체 연결 상태</option>
                <option value="UNLINKED">미연결 이용객 기록</option>
                <option value="LINKED">연결됨</option>
                {values.linkStatus && !['LINKED', 'UNLINKED'].includes(values.linkStatus) && (
                  <option value={values.linkStatus}>확인할 수 없는 연결 조건</option>
                )}
              </select>
              {errors.linkStatus && (
                <p className="submission-field-error" id="submission-link-status-error">{errors.linkStatus}</p>
              )}
            </div>
            {(['from', 'to'] as const).map((field) => (
              <div className="submission-filter-field" key={field}>
                <label htmlFor={`submission-${field}`}>{field === 'from' ? '방문일 시작' : '방문일 종료'}</label>
                <input
                  id={`submission-${field}`}
                  type="date"
                  value={values[field] ?? ''}
                  onChange={(event) => setValues((current) => ({ ...current, [field]: event.target.value || undefined }))}
                  aria-invalid={!!errors[field] || undefined}
                  aria-describedby={`submission-date-hint${errors[field] ? ` submission-${field}-error` : ''}`}
                />
                {errors[field] && (
                  <p className="submission-field-error" id={`submission-${field}-error`}>{errors[field]}</p>
                )}
              </div>
            ))}
          </div>
          <div className="submission-filters__footer">
            <div className="submission-filters__hints">
              <details className="submission-filters__guide">
                <summary>조회 기준</summary>
                <p id="submission-date-hint">방문일 기준이며 시작일과 종료일을 포함합니다. 제출 일시와 다를 수 있습니다.</p>
                <p id="submission-link-hint">미연결은 휴양소 QR로 제출한 입실·퇴실 기록 중 연결된 일정이 없는 기록입니다.</p>
              </details>
              {propertiesLoading && <p role="status">휴양소 목록을 불러오는 중입니다.</p>}
            </div>
            <div className="submission-filters__actions">
              <Button id="submission-filter-reset" className="admin-button-secondary" type="reset">초기화</Button>
              <Button id="submission-filter-apply" type="submit">조회</Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
