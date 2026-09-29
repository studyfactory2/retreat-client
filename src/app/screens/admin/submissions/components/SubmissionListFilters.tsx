import { useRef, useState } from 'react';
import type { AdminPropertyOption } from '../../../../features/admin-properties/admin-properties.types';
import type { AdminSubmissionListInput } from '../../../../features/admin-submissions/admin-submissions.types';
import { Button } from '../../../../shared/ui/Button/Button';
import {
  submissionFilterErrors,
  submissionTypeLabel,
  type SubmissionFilterErrors,
} from '../model/submission-list-model';

export function SubmissionListFilters({
  input,
  properties,
  propertiesLoading,
  onApply,
}: {
  input: AdminSubmissionListInput;
  properties?: AdminPropertyOption[];
  propertiesLoading: boolean;
  onApply: (input: AdminSubmissionListInput) => void;
}) {
  const [values, setValues] = useState(input);
  const [errors, setErrors] = useState<SubmissionFilterErrors>(() =>
    submissionFilterErrors(input),
  );
  const form = useRef<HTMLFormElement>(null);
  const missingProperty =
    values.propertyId &&
    !properties?.some((property) => property.id === values.propertyId);
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
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() =>
        form.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    onApply({ ...values, stayId: input.stayId, page: 1 });
  }
  return (
    <form
      className="submission-filters"
      noValidate
      ref={form}
      aria-label="체크리스트 기록 조회 조건"
      onSubmit={(event) => {
        event.preventDefault();
        apply();
      }}
    >
      <fieldset className="submission-filters__types">
        <legend>기록 유형</legend>
        {(['ALL', 'CHECK_IN', 'CHECK_OUT', 'MAINTENANCE'] as const).map(
          (type) => (
            <label
              key={type}
              className={(values.type ?? 'ALL') === type ? 'is-selected' : ''}
            >
              <input
                type="radio"
                name="submission-type"
                value={type}
                checked={(values.type ?? 'ALL') === type}
                onChange={() =>
                  setValues((current) => ({
                    ...current,
                    type: type === 'ALL' ? undefined : type,
                  }))
                }
              />
              <span>
                {type === 'ALL' ? '전체 기록' : submissionTypeLabel[type]}
              </span>
            </label>
          ),
        )}
      </fieldset>
      <div className="submission-filters__fields">
        <div className="submission-filter-field">
          <label htmlFor="submission-property">휴양소</label>
          <select
            id="submission-property"
            value={values.propertyId ?? ''}
            disabled={propertiesLoading}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                propertyId: event.target.value || undefined,
              }))
            }
          >
            <option value="">전체 휴양소</option>
            {missingProperty && (
              <option value={values.propertyId}>
                선택한 휴양소 ·{' '}
                {propertiesLoading ? '확인 중' : '목록에서 확인 불가'}
              </option>
            )}
            {properties?.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
                {property.isActive ? '' : ' · 비활성'}
              </option>
            ))}
          </select>
        </div>
        <div className="submission-filter-field">
          <label htmlFor="submission-status">기록 상태</label>
          <select
            id="submission-status"
            value={values.status ?? ''}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                status:
                  event.target.value === 'SUBMITTED' ||
                  event.target.value === 'CANCELLED'
                    ? event.target.value
                    : undefined,
              }))
            }
          >
            <option value="">전체 상태</option>
            <option value="SUBMITTED">제출됨</option>
            <option value="CANCELLED">취소됨</option>
          </select>
        </div>
        <div className="submission-filter-field">
          <label htmlFor="submission-link-status">일정 연결</label>
          <select
            id="submission-link-status"
            value={values.linkStatus ?? ''}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                linkStatus: event.target.value || undefined,
              }))
            }
            aria-invalid={!!errors.linkStatus || undefined}
            aria-describedby={`submission-link-hint${errors.linkStatus ? ' submission-link-status-error' : ''}`}
          >
            <option value="">전체 연결 상태</option>
            <option value="UNLINKED">미연결 이용객 기록</option>
            <option value="LINKED">연결됨</option>
            {values.linkStatus &&
              !['LINKED', 'UNLINKED'].includes(values.linkStatus) && (
                <option value={values.linkStatus}>확인할 수 없는 연결 조건</option>
              )}
          </select>
          {errors.linkStatus && (
            <p className="submission-field-error" id="submission-link-status-error">
              {errors.linkStatus}
            </p>
          )}
        </div>
        {(['from', 'to'] as const).map((field) => (
          <div className="submission-filter-field" key={field}>
            <label htmlFor={`submission-${field}`}>
              {field === 'from' ? '방문일 시작' : '방문일 종료'}
            </label>
            <input
              id={`submission-${field}`}
              type="date"
              value={values[field] ?? ''}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  [field]: event.target.value || undefined,
                }))
              }
              aria-invalid={!!errors[field] || undefined}
              aria-describedby={`submission-date-hint${errors[field] ? ` submission-${field}-error` : ''}`}
            />
            {errors[field] && (
              <p
                className="submission-field-error"
                id={`submission-${field}-error`}
              >
                {errors[field]}
              </p>
            )}
          </div>
        ))}
        <Button type="submit">조회</Button>
        <Button
          className="admin-button-secondary"
          onClick={() => {
            const reset = { page: 1, stayId: input.stayId };
            setValues(reset);
            setErrors({});
            onApply(reset);
          }}
        >
          조건 초기화
        </Button>
      </div>
      <p id="submission-date-hint" className="submission-filters__hint">
        날짜는 기록의 방문일 기준입니다. 제출 일시와는 다를 수 있습니다.
      </p>
      <p id="submission-link-hint" className="submission-filters__hint">
        미연결은 휴양소 QR로 제출된 입실·퇴실 기록 중 일정이 연결되지 않은 기록입니다.
      </p>
      {propertiesLoading && (
        <p className="submission-filters__hint" role="status">
          휴양소 선택 목록을 불러오고 있습니다.
        </p>
      )}
    </form>
  );
}
