import { useState } from 'react';
import type { GetAdminPropertiesInput } from '../../../../features/admin-properties/admin-property-management.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { normalizePropertySearch } from '../model/property-list-model';

export function PropertyFilters({
  input,
  onApply,
}: {
  input: GetAdminPropertiesInput;
  onApply: (input: GetAdminPropertiesInput) => void;
}) {
  const [text, setText] = useState(input.search ?? '');
  const [status, setStatus] = useState(
    input.isActive === undefined
      ? 'all'
      : input.isActive
        ? 'active'
        : 'inactive',
  );
  return (
    <form
      id="property-filters"
      className="property-directory-filters"
      aria-label="휴양소 조회 조건"
      onSubmit={(event) => {
        event.preventDefault();
        onApply({
          page: 1,
          search: normalizePropertySearch(text),
          isActive: status === 'all' ? undefined : status === 'active',
        });
      }}
    >
      <div>
        <label htmlFor="properties-search">휴양소 검색</label>
        <input
          id="properties-search"
          type="search"
          placeholder="휴양소 이름·지역 검색"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </div>
      <div>
        <label htmlFor="properties-status">운영 상태</label>
        <select
          id="properties-status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">전체 상태</option>
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
        </select>
      </div>
      <div className="admin-directory-filter-actions">
        <Button id="property-filter-submit" type="submit" className="admin-button-secondary">
          조회
        </Button>
        <Button
          id="property-filter-reset"
          className="admin-directory-reset"
          onClick={() => {
            setText('');
            setStatus('all');
            onApply({ page: 1 });
          }}
        >
          초기화
        </Button>
      </div>
    </form>
  );
}
