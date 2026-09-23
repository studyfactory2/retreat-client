import { useState } from 'react';
import type { AdminPropertyOption } from '../../../features/admin-properties/admin-properties.types';
import { Button } from '../../../shared/ui/Button/Button';
import { getSeoulToday } from '../../../core/dates/seoul-date';

type DashboardFiltersProps = {
  date: string;
  propertyId: string;
  properties: AdminPropertyOption[];
  propertiesLoading: boolean;
  propertiesError: boolean;
  onApply: (date: string, propertyId: string) => void;
  onToday: (propertyId: string) => void;
};

export function DashboardFilters(props: DashboardFiltersProps) {
  const [date, setDate] = useState(props.date);
  const [propertyId, setPropertyId] = useState(props.propertyId);
  const missingProperty =
    propertyId &&
    !props.properties.some((property) => property.id === propertyId);

  return (
    <form
      className="dashboard-filters"
      aria-label="운영 현황 조회 조건"
      onSubmit={(event) => {
        event.preventDefault();
        props.onApply(date, propertyId);
      }}
    >
      <div className="dashboard-filters__field">
        <label htmlFor="dashboard-date">조회 날짜</label>
        <input
          id="dashboard-date"
          type="date"
          required
          min="1900-01-01"
          max="2100-12-31"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </div>
      <div className="dashboard-filters__field dashboard-filters__property">
        <label htmlFor="dashboard-property">휴양소</label>
        <select
          id="dashboard-property"
          value={propertyId}
          disabled={props.propertiesLoading}
          aria-describedby={
            props.propertiesError ? 'property-load-error' : undefined
          }
          onChange={(event) => setPropertyId(event.target.value)}
        >
          <option value="">전체 휴양소</option>
          {missingProperty && (
            <option value={propertyId}>
              {props.propertiesLoading
                ? '선택한 휴양소 확인 중'
                : '선택한 휴양소 (목록 확인 필요)'}
            </option>
          )}
          {props.properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.name}
              {property.isActive ? '' : ' · 비활성'}
            </option>
          ))}
        </select>
      </div>
      <div className="dashboard-filters__actions">
        <Button type="submit">조회</Button>
        <Button
          className="admin-button-secondary"
          onClick={() => {
            setDate(getSeoulToday());
            props.onToday(propertyId);
          }}
        >
          오늘
        </Button>
      </div>
    </form>
  );
}
