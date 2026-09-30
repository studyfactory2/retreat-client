import { useState } from 'react';
import type { GetAdminIssueCategoriesInput } from '../../../../features/admin-issue-categories/admin-issue-category.types';
import {
  categoryFilterError,
  categoryFilterInput,
  type CategoryFiltersValue,
} from '../model/issue-category-model';
import { CategoryFilters } from './CategoryFilters';

export function CategoryFilterPanel({
  initial,
  onApply,
}: {
  initial: CategoryFiltersValue;
  onApply: (input: GetAdminIssueCategoriesInput) => void;
}) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <CategoryFilters
        values={values}
        onChange={(next) => {
          setValues(next);
          setError(null);
        }}
        onApply={() => {
          const invalid = categoryFilterError(values);
          setError(invalid);
          if (!invalid) onApply(categoryFilterInput(values));
        }}
        onReset={() => {
          setValues({ search: '', activity: 'all' });
          setError(null);
          onApply({ page: 1 });
        }}
        disabled={false}
      />
      {error && (
        <p role="alert" className="category-banner category-banner--error">
          {error}
        </p>
      )}
    </>
  );
}
