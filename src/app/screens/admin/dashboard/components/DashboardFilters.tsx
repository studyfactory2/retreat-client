import { useState } from 'react';
import type { AdminPropertyOption } from '../../../../features/admin-properties/admin-properties.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { AdminPropertySelect } from '../../components/AdminPropertySelect';
import { getSeoulToday } from '../../../../core/dates/seoul-date';

type DashboardFiltersProps = {
  date: string;
  propertyId: string;
  properties: AdminPropertyOption[];
  propertiesLoading: boolean;
  propertiesError: boolean;
  onApply: (date: string, propertyId: string) => void;
  onToday: (propertyId: string) => void;
  onReset: () => void;
};

export function DashboardFilters(props: DashboardFiltersProps) {
  const [date, setDate] = useState(props.date);
  const [propertyId, setPropertyId] = useState(props.propertyId);

  return (
    <form
      id="dashboard-filters"
      className="dashboard-filters"
      aria-label="운영 현황 조회 조건"
      onReset={() => {
        setDate(getSeoulToday());
        setPropertyId('');
        props.onReset();
      }}
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
        <AdminPropertySelect
          id="dashboard-property"
          value={propertyId}
          properties={props.propertiesError ? undefined : props.properties}
          loading={props.propertiesLoading}
          describedBy={
            props.propertiesError ? 'property-load-error' : undefined
          }
          onChange={setPropertyId}
        />
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
