import type { GetStayImportInput } from '../../../features/admin-stay-imports/admin-stay-imports.types';
import { readImportFilters, importFilterSearch } from './import-review-model';

export function ImportRowFilters({
  input,
  total,
  disabled,
  onChange,
}: {
  input: GetStayImportInput;
  total: number;
  disabled: boolean;
  onChange: (input: GetStayImportInput) => void;
}) {
  function change(field: 'validationStatus' | 'action', value: string) {
    const search = new URLSearchParams(importFilterSearch(input));
    search.delete('page');
    if (value) search.set(field, value);
    else search.delete(field);
    onChange(readImportFilters(search));
  }
  return (
    <div className="stay-import-filters">
      <div>
        <label htmlFor="import-validation-filter">검증 상태</label>
        <select
          id="import-validation-filter"
          disabled={disabled}
          value={input.validationStatus ?? ''}
          onChange={(event) => change('validationStatus', event.target.value)}
        >
          <option value="">전체 검증 상태</option>
          <option value="VALID">검증 완료 (제외 행 포함)</option>
          <option value="NEEDS_REVIEW">확인 필요</option>
          <option value="INVALID">오류</option>
        </select>
      </div>
      <div>
        <label htmlFor="import-action-filter">처리 방법</label>
        <select
          id="import-action-filter"
          disabled={disabled}
          value={input.action ?? ''}
          onChange={(event) => change('action', event.target.value)}
        >
          <option value="">전체 처리 방법</option>
          <option value="CREATE">등록 대상</option>
          <option value="SKIP">제외</option>
          {input.action === 'UPDATE' && (
            <option value="UPDATE">지원하지 않는 수정 행</option>
          )}
        </select>
      </div>
      <p>현재 조건 {total}건 · 상단 요약은 명단 전체 기준</p>
    </div>
  );
}
