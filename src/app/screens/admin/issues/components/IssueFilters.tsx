import { useRef, useState } from 'react';
import type { AdminIssueFilters } from '../../../../features/admin-issues/admin-issues.types';
import type { AdminPropertyOption } from '../../../../features/admin-properties/admin-properties.types';
import { Button } from '../../../../shared/ui/Button/Button';
import {
  issueFilterErrors,
  type IssueFilterErrors,
} from '../model/issue-filters';
import { AdminPropertySelect } from '../../components/AdminPropertySelect';

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
  propertyError = false,
  onApply,
  onReset,
}: {
  input: AdminIssueFilters;
  properties?: AdminPropertyOption[];
  propertiesLoading: boolean;
  propertyError?: boolean;
  onApply: (value: AdminIssueFilters) => void;
  onReset: () => void;
}) {
  const [draft, setDraft] = useState(input);
  const [submitted, setSubmitted] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const [dateErrors, setDateErrors] = useState<IssueFilterErrors>({});
  const errors = { ...issueFilterErrors(draft), ...dateErrors };
  const showErrors =
    submitted || Object.keys(issueFilterErrors(input)).length > 0;
  function change(key: keyof AdminIssueFilters, value: string) {
    setDraft((current) => ({ ...current, [key]: value || undefined, page: 1 }));
    if (key === 'from' || key === 'to')
      setDateErrors((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
  }
  const error = (key: keyof typeof errors) =>
    showErrors && errors[key] ? (
      <span className="issue-field-error" id={`issue-${key}-error`}>
        {errors[key]}
      </span>
    ) : null;
  return (
    <form
      ref={form}
      id="issue-filters"
      onReset={(event) => {
        event.preventDefault();
        onReset();
      }}
      className="issue-filters"
      aria-label="이상사항 조회 조건"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
        const nativeErrors: IssueFilterErrors = {};
        for (const field of ['from', 'to'] as const) {
          if (
            form.current?.querySelector<HTMLInputElement>(`#issue-${field}`)
              ?.validity.badInput
          )
            nativeErrors[field] =
              '접수일의 연도, 월, 일을 모두 올바르게 입력해 주세요.';
        }
        setDateErrors(nativeErrors);
        if (
          Object.values({ ...issueFilterErrors(draft), ...nativeErrors }).some(
            Boolean,
          )
        ) {
          requestAnimationFrame(() =>
            form.current
              ?.querySelector<HTMLElement>('[aria-invalid="true"]')
              ?.focus(),
          );
          return;
        }
        onApply({ ...draft, page: 1 });
      }}
    >
      <div className="issue-filters__fields">
        <div className="issue-field issue-field--property">
          <AdminPropertySelect
            id="issue-property"
            value={draft.propertyId ?? ''}
            properties={properties}
            loading={propertiesLoading}
            onChange={(value) => change('propertyId', value)}
            invalid={showErrors && !!errors.propertyId}
            describedBy={
              [
                showErrors && errors.propertyId ? 'issue-propertyId-error' : '',
                propertyError ? 'issue-properties-error' : '',
              ]
                .filter(Boolean)
                .join(' ') || undefined
            }
          />
          {error('propertyId')}
        </div>
        <div className="issue-field">
          <label htmlFor="issue-status">처리 상태</label>
          <select id="issue-status" name="status" value={draft.status ?? ''}
            onChange={(event) => change('status', event.target.value)}
            aria-invalid={showErrors && !!errors.status}
            aria-describedby={showErrors && errors.status ? 'issue-status-error' : undefined}>
            {draft.status !== undefined && !statuses.some(([value]) => value === draft.status) && (
              <option value={draft.status}>처리 상태 선택</option>
            )}
            {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          {error('status')}
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
        <div className="issue-field">
          <label htmlFor="issue-cancellation">취소 여부</label>
          <select
            id="issue-cancellation"
            name="cancellation"
            value={draft.cancellation ?? 'active'}
            onChange={(event) => change('cancellation', event.target.value)}
            aria-invalid={showErrors && !!errors.cancellation}
            aria-describedby={
              showErrors && errors.cancellation
                ? 'issue-cancellation-error'
                : undefined
            }
          >
            {draft.cancellation !== undefined &&
              !['active', 'cancelled', 'all'].includes(draft.cancellation) && (
                <option value={draft.cancellation}>잘못된 취소 조건</option>
              )}
            <option value="active">취소 제외</option>
            <option value="cancelled">취소만</option>
            <option value="all">취소 포함</option>
          </select>
          {error('cancellation')}
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
      {(['propertyId', 'status', 'isUrgent', 'cancellation', 'from', 'to'] as const)
        .some((key) => draft[key] !== input[key]) && (
        <p className="issue-filters__pending" role="status">변경한 조건은 조회 후 반영됩니다.</p>
      )}
      <div className="issue-filters__footer">
        <div>
          <p id="issue-date-hint">
            접수일은 한국 시간 기준 · 날짜를 비우면 전체 기간
          </p>
          {propertiesLoading && (
            <p role="status">휴양소 선택 목록을 불러오고 있습니다.</p>
          )}
        </div>
        <div className="issue-filters__actions">
          <Button id="issue-filter-reset" className="admin-button-secondary" type="reset">
            초기화
          </Button>
          <Button id="issue-filter-apply" type="submit">조회</Button>
        </div>
      </div>
    </form>
  );
}
