import type { GetStayImportInput } from '../../../../features/admin-stay-imports/admin-stay-imports.types';
import { ScheduleIcon } from '../../schedule/components/ScheduleIcon';
import {
  readImportFilters,
  importFilterSearch,
} from '../model/import-review-model';
import '../styles/import-review-list.css';

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
  const activeCount = Number(!!input.validationStatus) + Number(!!input.action);
  function change(field: 'validationStatus' | 'action', value: string) {
    const search = new URLSearchParams(importFilterSearch(input));
    search.delete('page');
    if (value) search.set(field, value);
    else search.delete(field);
    onChange(readImportFilters(search));
  }
  return (
    <details className="import-review-filters">
      <summary>
        <span className="import-review-filters__label">
          <ScheduleIcon name="filter" />
          필터
          {activeCount > 0 && <span>{activeCount}개 적용</span>}
        </span>
        <span className="import-review-filters__total">
          {total.toLocaleString('ko-KR')}건
        </span>
        <span className="import-review-filters__chevron">
          <ScheduleIcon name="chevron" />
        </span>
      </summary>
      <div className="import-review-filters__fields">
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
      </div>
    </details>
  );
}
