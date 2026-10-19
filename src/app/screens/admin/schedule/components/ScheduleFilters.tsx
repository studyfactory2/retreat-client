import { useState } from 'react';
import type { AdminPropertyOption } from '../../../../features/admin-properties/admin-properties.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { AdminPropertySelect } from '../../components/AdminPropertySelect';
import {
  validateScheduleRange,
  type ScheduleListFilters,
} from '../model/schedule-list-model';

export function ScheduleFilters({
  input,
  properties,
  loading,
  propertyError,
  onApply,
  onReset,
}: {
  input: ScheduleListFilters;
  properties?: AdminPropertyOption[];
  loading: boolean;
  propertyError: boolean;
  onApply: (next: ScheduleListFilters) => void;
  onReset: () => ScheduleListFilters;
}) {
  const [from, setFrom] = useState(input.from);
  const [to, setTo] = useState(input.to);
  const [propertyId, setPropertyId] = useState(input.propertyId ?? '');
  const [error, setError] = useState<string>();
  return (
    <form
      id="schedule-filters"
      className="schedule-filters"
      noValidate
      aria-label="일정 목록 조회 조건"
      onReset={(event) => {
        event.preventDefault();
        const next = onReset();
        setFrom(next.from);
        setTo(next.to);
        setPropertyId(next.propertyId ?? '');
        setError(undefined);
      }}
      onSubmit={(event) => {
        event.preventDefault();
        const message = validateScheduleRange(from, to);
        setError(message);
        if (message) {
          document.getElementById('schedule-from')?.focus();
          return;
        }
        onApply({
          ...input,
          from,
          to,
          propertyId: propertyId || undefined,
          page: 1,
        });
      }}
    >
      <AdminPropertySelect
        id="schedule-property"
        value={propertyId}
        properties={properties}
        loading={loading}
        describedBy={propertyError ? 'schedule-property-error' : undefined}
        onChange={setPropertyId}
      />
      <div className="schedule-filters__date">
        <label htmlFor="schedule-from">시작일</label>
        <input
          id="schedule-from"
          type="date"
          min="1900-01-01"
          max="2100-12-31"
          value={from}
          aria-invalid={!!error || undefined}
          aria-describedby={
            error ? 'schedule-range-error' : 'schedule-range-hint'
          }
          onChange={(event) => {
            setFrom(event.target.value);
            setError(undefined);
          }}
        />
      </div>
      <div className="schedule-filters__date">
        <label htmlFor="schedule-to">종료일</label>
        <input
          id="schedule-to"
          type="date"
          min="1900-01-01"
          max="2100-12-31"
          value={to}
          aria-invalid={!!error || undefined}
          aria-describedby={
            error ? 'schedule-range-error' : 'schedule-range-hint'
          }
          onChange={(event) => {
            setTo(event.target.value);
            setError(undefined);
          }}
        />
      </div>
      <div className="schedule-filters__actions">
        <Button type="submit">
          조회
        </Button>
        <Button type="reset" className="schedule-button-quiet">
          초기화
        </Button>
      </div>
      <p id="schedule-range-hint" className="schedule-filters__hint">
        한국 시간 · 선택 기간과 겹치는 등록 일정 · 최대 62일
      </p>
      {error && (
        <p
          id="schedule-range-error"
          className="schedule-filters__error"
          role="alert"
        >
          {error}
        </p>
      )}
    </form>
  );
}
