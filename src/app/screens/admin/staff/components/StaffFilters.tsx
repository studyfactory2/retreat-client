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
      className="staff-toolbar"
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
          placeholder="이름, 연락처, 회사 또는 부서"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </div>
      <div>
        <label htmlFor="staff-status">활성 상태</label>
        <select
          id="staff-status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">전체</option>
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
        </select>
      </div>
      <div className="staff-actions">
        <Button type="submit">조회</Button>
        <Button
          className="admin-button-secondary"
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
