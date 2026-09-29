import { useRef, useState } from 'react';
import type { AdminIssueFilters } from '../../../../features/admin-issues/admin-issues.types';
import type { AdminPropertyOption } from '../../../../features/admin-properties/admin-properties.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { issueFilterErrors } from '../model/issue-filters';

const statuses = [
  ['', '전체'],
  ['NEW', '신규 접수'],
  ['IN_PROGRESS', '조치 중'],
  ['RESOLVED', '해결 완료'],
] as const;
export function IssueFilters({
  input,
  properties,
  propertiesLoading,
  onApply,
}: {
  input: AdminIssueFilters;
  properties?: AdminPropertyOption[];
  propertiesLoading: boolean;
  onApply: (value: AdminIssueFilters) => void;
}) {
  const [draft, setDraft] = useState(input);
  const [submitted, setSubmitted] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const errors = issueFilterErrors(draft);
  const showErrors =
    submitted || Object.keys(issueFilterErrors(input)).length > 0;
  function change(key: keyof AdminIssueFilters, value: string) {
    setDraft((current) => ({ ...current, [key]: value || undefined, page: 1 }));
  }
  const missingProperty =
    draft.propertyId &&
    !properties?.some((property) => property.id === draft.propertyId);
  const error = (key: keyof typeof errors) =>
    showErrors && errors[key] ? (
      <span className="issue-field-error" id={`issue-${key}-error`}>
        {errors[key]}
      </span>
    ) : null;
  return (
    <form
      ref={form}
      className="issue-filters"
      aria-label="이상사항 조회 조건"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
        if (Object.keys(errors).length) {
          form.current
            ?.querySelector<HTMLElement>(`[name="${Object.keys(errors)[0]}"]`)
            ?.focus();
          return;
        }
        onApply({ ...draft, page: 1 });
      }}
    >
      <fieldset className="issue-filters__statuses">
        <legend>처리 상태</legend>
        <div>
          {statuses.map(([value, label]) => (
            <label
              key={value}
              className={(draft.status ?? '') === value ? 'is-selected' : ''}
            >
              <input
                name="status"
                type="radio"
                checked={(draft.status ?? '') === value}
                onChange={() => change('status', value)}
                aria-invalid={showErrors && !!errors.status}
                aria-describedby={
                  showErrors && errors.status ? 'issue-status-error' : undefined
                }
              />
              {label}
            </label>
          ))}
        </div>
        {error('status')}
      </fieldset>
      <div className="issue-filters__fields">
        <div className="issue-field">
          <label htmlFor="issue-property">휴양소</label>
          <select
            id="issue-property"
            name="propertyId"
            value={draft.propertyId ?? ''}
            disabled={propertiesLoading}
            onChange={(event) => change('propertyId', event.target.value)}
            aria-invalid={showErrors && !!errors.propertyId}
            aria-describedby={
              showErrors && errors.propertyId
                ? 'issue-propertyId-error'
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
          {error('propertyId')}
        </div>
        <div className="issue-field">
          <label htmlFor="issue-urgency">긴급 여부</label>
          <select
            id="issue-urgency"
            name="isUrgent"
            value={draft.isUrgent ?? ''}
            onChange={(event) => change('isUrgent', event.target.value)}
            aria-invalid={showErrors && !!errors.isUrgent}
            aria-describedby={
              showErrors && errors.isUrgent ? 'issue-isUrgent-error' : undefined
            }
          >
            {draft.isUrgent && !['true', 'false'].includes(draft.isUrgent) && (
              <option value={draft.isUrgent}>잘못된 긴급 조건</option>
            )}
            <option value="">전체</option>
            <option value="true">긴급 신고</option>
            <option value="false">일반 신고</option>
          </select>
          {error('isUrgent')}
        </div>
        {(['from', 'to'] as const).map((key) => (
          <div className="issue-field" key={key}>
            <label htmlFor={`issue-${key}`}>
              {key === 'from' ? '접수 시작일' : '접수 종료일'}
            </label>
            <input
              id={`issue-${key}`}
              name={key}
              type="date"
              min="0001-01-01"
              max="9999-12-31"
              value={draft[key] ?? ''}
              onChange={(event) => change(key, event.target.value)}
              aria-invalid={showErrors && !!errors[key]}
              aria-describedby={`issue-date-hint${showErrors && errors[key] ? ` issue-${key}-error` : ''}`}
            />
            {error(key)}
          </div>
        ))}
      </div>
      <div className="issue-filters__footer">
        <div>
          <p id="issue-date-hint">
            접수일 · 한국 시간 기준. 날짜를 비우면 전체 기간이며, 시작일이나
            종료일만 선택할 수도 있습니다.
          </p>
          {propertiesLoading && (
            <p role="status">휴양소 선택 목록을 불러오고 있습니다.</p>
          )}
        </div>
        <div className="issue-filters__actions">
          <Button
            className="admin-button-secondary"
            onClick={() => {
              const defaults = { page: 1 };
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
