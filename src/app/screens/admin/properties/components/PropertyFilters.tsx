import { useState } from 'react';
import type { GetAdminPropertiesInput } from '../../../../features/admin-properties/admin-property-management.types';
import { Button } from '../../../../shared/ui/Button/Button';

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
      className="admin-directory-filters"
      aria-label="휴양소 조회 조건"
      onSubmit={(event) => {
        event.preventDefault();
        onApply({
          page: 1,
          search: text.trim() || undefined,
          isActive: status === 'all' ? undefined : status === 'active',
        });
      }}
    >
      <div>
        <label htmlFor="properties-search">휴양소 검색</label>
        <input
          id="properties-search"
          type="search"
          placeholder="휴양소 이름 또는 지역"
          maxLength={100}
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
          <option value="all">전체</option>
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
        </select>
      </div>
      <div className="admin-directory-filter-actions">
        <Button type="submit" className="admin-button-secondary">
          조회
        </Button>
        <Button
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
