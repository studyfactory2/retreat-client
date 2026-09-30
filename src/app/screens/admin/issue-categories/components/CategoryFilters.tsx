import { CATEGORY_LIMITS } from '../../../../features/admin-issue-categories/admin-issue-category-validation';
import { Button } from '../../../../shared/ui/Button/Button';
import type { CategoryFiltersValue } from '../model/issue-category-model';
import '../styles/issue-categories.css';

export function CategoryFilters({
  values,
  onChange,
  onApply,
  onReset,
  disabled,
}: {
  values: CategoryFiltersValue;
  onChange: (values: CategoryFiltersValue) => void;
  onApply: () => void;
  onReset: () => void;
  disabled: boolean;
}) {
  const searchTooLong =
    [...values.search.trim()].length > CATEGORY_LIMITS.search;
  return (
    <form
      className="category-filters"
      aria-label="이상사항 분류 조회 조건"
      onSubmit={(event) => {
        event.preventDefault();
        if (!disabled && !searchTooLong) onApply();
      }}
    >
      <div className="category-filters__search">
        <label htmlFor="category-search">분류명 검색</label>
        <input
          id="category-search"
          type="search"
          value={values.search}
          placeholder="분류명을 입력하세요"
          disabled={disabled}
          aria-invalid={searchTooLong || undefined}
          aria-describedby={searchTooLong ? 'category-search-error' : undefined}
          onChange={(event) =>
            onChange({ ...values, search: event.target.value })
          }
        />
        {searchTooLong && (
          <p
            className="category-field__error"
            id="category-search-error"
            role="alert"
          >
            검색어는 100자 이하로 입력해 주세요.
          </p>
        )}
      </div>
      <div>
        <label htmlFor="category-activity">활성 상태</label>
        <select
          id="category-activity"
          value={values.activity}
          disabled={disabled}
          onChange={(event) => {
            const activity = event.target.value;
            if (
              activity === 'all' ||
              activity === 'active' ||
              activity === 'inactive'
            )
              onChange({ ...values, activity });
          }}
        >
          <option value="all">전체</option>
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
        </select>
      </div>
      <div className="category-actions">
        <Button type="submit" disabled={disabled || searchTooLong}>
          조회
        </Button>
        <Button
          className="admin-button-secondary"
          disabled={disabled}
          onClick={onReset}
        >
          초기화
        </Button>
      </div>
    </form>
  );
}
