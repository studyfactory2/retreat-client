import { useState } from 'react';
import type { GetAdminPropertiesInput } from '../../../../features/admin-properties/admin-property-management.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { normalizePropertySearch } from '../model/property-list-model';

export function PropertyFilters({ input, onApply }: { input: GetAdminPropertiesInput; onApply: (input: GetAdminPropertiesInput) => void }) {
  const [text, setText] = useState(input.search ?? '');
  return (
    <div className="property-directory-controls">
      <div className="property-directory-status-tabs" role="group" aria-label="운영 상태">
        {([{ label: '운영 중', value: true }, { label: '보관됨', value: false }, { label: '전체', value: undefined }] as const).map(({ label, value }) => (
          <Button key={label} aria-pressed={input.isActive === value} onClick={() => onApply({ ...input, page: 1, isActive: value })}>{label}</Button>
        ))}
      </div>
      <form id="property-filters" className="property-directory-filters" aria-label="휴양소 조회 조건" onSubmit={(event) => { event.preventDefault(); onApply({ ...input, page: 1, search: normalizePropertySearch(text) }); }}>
        <div><label htmlFor="properties-search">휴양소 검색</label><input id="properties-search" type="search" placeholder="휴양소 이름·지역 검색" value={text} onChange={(event) => setText(event.target.value)} /></div>
        <div className="admin-directory-filter-actions">
          <Button id="property-filter-submit" type="submit" className="admin-button-secondary">조회</Button>
          {input.search && <Button id="property-filter-reset" className="admin-directory-reset" onClick={() => { setText(''); onApply({ page: 1, isActive: input.isActive }); }}>초기화</Button>}
        </div>
      </form>
    </div>
  );
}
