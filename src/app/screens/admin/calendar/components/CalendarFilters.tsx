import { useState } from 'react';
import type { AdminPropertyOption } from '../../../../features/admin-properties/admin-properties.types';
import { isCalendarDate } from '../../../../features/admin-calendar/admin-calendar-filters';
import { Button } from '../../../../shared/ui/Button/Button';
import { AdminPropertySelect } from '../../components/AdminPropertySelect';

export function CalendarFilters({
  date,
  propertyId,
  properties,
  propertiesLoading,
  propertyError,
  onApply,
  onReset,
}: {
  date: string;
  propertyId?: string;
  properties?: AdminPropertyOption[];
  propertiesLoading: boolean;
  propertyError: boolean;
  onApply: (date: string, propertyId: string) => void;
  onReset: () => string;
}) {
  const [selectedDate, setSelectedDate] = useState(date);
  const [selectedProperty, setSelectedProperty] = useState(propertyId ?? '');
  const [error, setError] = useState('');
  return (
    <form
      id="calendar-filters"
      className="calendar-filters__row"
      aria-label="이용 일정 조회 조건"
      onReset={(event) => {
        event.preventDefault();
        const nextDate = onReset();
        setSelectedDate(nextDate);
        setSelectedProperty('');
        setError('');
      }}
      onSubmit={(event) => {
        event.preventDefault();
        if (!isCalendarDate(selectedDate)) {
          setError('1900년부터 2100년 사이의 올바른 날짜를 선택해 주세요.');
          return;
        }
        setError('');
        onApply(selectedDate, selectedProperty);
      }}
    >
      <div className="calendar-filters__property">
        <AdminPropertySelect
          id="calendar-property"
          value={selectedProperty}
          properties={properties}
          loading={propertiesLoading}
          describedBy={propertyError ? 'calendar-property-error' : undefined}
          onChange={setSelectedProperty}
        />
      </div>
      <div className="calendar-filters__date">
        <label htmlFor="calendar-date">선택 날짜</label>
        <input
          id="calendar-date"
          type="date"
          min="1900-01-01"
          max="2100-12-31"
          required
          value={selectedDate}
          onChange={(event) => {
            setSelectedDate(event.target.value);
            setError('');
          }}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? 'calendar-date-error' : undefined}
        />
      </div>
      <div className="calendar-filters__actions">
        <Button type="submit" className="admin-button-secondary">
          조회
        </Button>
        <Button type="reset" className="calendar-reset">
          초기화
        </Button>
      </div>
      {error && (
        <p
          id="calendar-date-error"
          className="calendar-filters__validation"
          role="alert"
        >
          {error}
        </p>
      )}
    </form>
  );
}
