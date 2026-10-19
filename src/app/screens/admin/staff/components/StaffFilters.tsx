import { useState } from 'react';
import type { GetAdminStaffInput } from '../../../../features/admin-staff/admin-staff.types';
import { Button } from '../../../../shared/ui/Button/Button';

export function StaffFilters({
  input,
  onApply,
}: {
  input: GetAdminStaffInput;
  onApply: (input: GetAdminStaffInput) => void;
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
      id="staff-filters"
      className="staff-directory-filters"
      aria-label="직원 조회 조건"
      onSubmit={(event) => {
        event.preventDefault();
        onApply({
          page: 1,
          search: [...text.trim()].slice(0, 100).join('') || undefined,
          isActive: status === 'all' ? undefined : status === 'active',
        });
      }}
    >
      <div>
        <label htmlFor="staff-search">직원 검색</label>
        <input
          id="staff-search"
          type="search"
          placeholder="이름·연락처·회사·부서 검색"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </div>
      <div>
        <label htmlFor="staff-status">상태</label>
        <select
          id="staff-status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">전체 상태</option>
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
        </select>
      </div>
      <div className="admin-directory-filter-actions">
        <Button id="staff-filter-submit" type="submit" className="admin-button-secondary">
          조회
        </Button>
        <Button
          id="staff-filter-reset"
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
