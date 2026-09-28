import { useState } from 'react';
import type { AdminPropertyOption } from '../../../../features/admin-properties/admin-properties.types';
import type { GetAdminStaysInput } from '../../../../features/admin-stays/admin-stay-management.types';
import { Button } from '../../../../shared/ui/Button/Button';

type StayListFiltersProps = {
  input: GetAdminStaysInput;
  properties?: AdminPropertyOption[];
  propertiesLoading: boolean;
  onApply: (input: GetAdminStaysInput) => void;
};

export function StayListFilters({
  input,
  properties,
  propertiesLoading,
  onApply,
}: StayListFiltersProps) {
  const [search, setSearch] = useState(input.search ?? '');
  const [propertyId, setPropertyId] = useState(input.propertyId ?? '');
  const [status, setStatus] = useState<GetAdminStaysInput['status']>(
    input.status,
  );
  const missingProperty =
    propertyId && !properties?.some((item) => item.id === propertyId);

  return (
    <form
      className="stay-list-filters"
      aria-label="이용 일정 조회 조건"
      onSubmit={(event) => {
        event.preventDefault();
        onApply({
          page: 1,
          search,
          propertyId: propertyId || undefined,
          status,
        });
      }}
    >
      <div className="stay-list-filters__search">
        <label htmlFor="stay-list-search">이용객 검색</label>
        <input
          id="stay-list-search"
          name="search"
          type="search"
          placeholder="이름, 회사, 부서 또는 연락처"
          maxLength={100}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      <div>
        <label htmlFor="stay-list-property">휴양소</label>
        <select
          id="stay-list-property"
          name="propertyId"
          value={propertyId}
          disabled={propertiesLoading}
          aria-describedby={
            propertiesLoading
              ? 'stay-list-properties-loading'
              : properties === undefined
                ? 'stay-list-properties-error'
                : undefined
          }
          onChange={(event) => setPropertyId(event.target.value)}
        >
          <option value="">전체 휴양소</option>
          {missingProperty && (
            <option value={propertyId}>
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
      </div>
      <div>
        <label htmlFor="stay-list-status">일정 상태</label>
        <select
          id="stay-list-status"
          name="status"
          value={status ?? ''}
          onChange={(event) =>
            setStatus(
              event.target.value === 'ACTIVE' ||
                event.target.value === 'CANCELLED'
                ? event.target.value
                : undefined,
            )
          }
        >
          <option value="">전체 상태</option>
          <option value="ACTIVE">등록됨</option>
          <option value="CANCELLED">취소됨</option>
        </select>
      </div>
      <Button type="submit" className="admin-button-secondary">
        조회
      </Button>
      {propertiesLoading && (
        <p
          id="stay-list-properties-loading"
          className="stay-list-filters__notice"
          role="status"
        >
          휴양소 선택 목록을 불러오고 있습니다.
        </p>
      )}
    </form>
  );
}
