import type { AdminIssueCategoryDto } from '../../../../features/admin-issue-categories/admin-issue-category.types';
import {
  CATEGORY_LIMITS,
  FALLBACK_CATEGORY_NAME,
} from '../../../../features/admin-issue-categories/admin-issue-category-validation';
import type {
  CategoryFormErrors,
  CategoryFormValues,
} from '../model/issue-category-model';
import '../styles/issue-categories.css';

export function CategoryForm({
  values,
  onChange,
  errors,
  original,
  disabled,
}: {
  values: CategoryFormValues;
  onChange: (values: CategoryFormValues) => void;
  errors: CategoryFormErrors;
  original?: AdminIssueCategoryDto;
  disabled: boolean;
}) {
  const fallback = original?.isFallback ?? false;
  const creatingFallback =
    !original && values.name.trim() === FALLBACK_CATEGORY_NAME;
  const lockedActive = fallback && !!original?.isActive;
  const nameCount = [...values.name.trim()].length;
  return (
    <fieldset className="category-form" disabled={disabled}>
      <legend className="category-sr-only">이상사항 분류 정보</legend>
      <section
        className="category-panel"
        aria-labelledby="category-basic-title"
      >
        <div className="category-panel__heading">
          <p className="category-eyebrow">SHARED CATEGORY</p>
          <h2 id="category-basic-title">분류 기본 정보</h2>
          <p>모든 휴양소에서 함께 사용할 분류명과 표시 순서를 설정합니다.</p>
        </div>
        {(fallback || creatingFallback) && (
          <div className="category-form__fallback">
            <strong>기본 분류 · {FALLBACK_CATEGORY_NAME}</strong>
            <p>
              체크리스트의 이상 항목에 사용하는 분류입니다. 등록 후 이름은 바꿀
              수 없으며, 활성 상태에서는 비활성화할 수 없습니다. 표시 순서는
              변경할 수 있습니다.
            </p>
          </div>
        )}
        <div className="category-form__grid">
          <div className="category-field">
            <label htmlFor="category-name">
              분류명 <span>{fallback ? '변경 불가' : '필수'}</span>
            </label>
            <input
              id="category-name"
              value={values.name}
              readOnly={fallback}
              aria-required="true"
              aria-invalid={!!errors.name}
              aria-describedby={`category-name-hint${errors.name ? ' category-name-error' : ''}`}
              autoComplete="off"
              onChange={(event) => {
                if (!fallback)
                  onChange({ ...values, name: event.target.value });
              }}
            />
            <p
              id="category-name-hint"
              className={`category-field__hint${nameCount > CATEGORY_LIMITS.name ? ' category-field__error' : ''}`}
            >
              {nameCount.toLocaleString('ko-KR')} / {CATEGORY_LIMITS.name}자 ·
              앞뒤 공백 제외
            </p>
            {errors.name && (
              <p
                className="category-field__error"
                id="category-name-error"
                role="alert"
              >
                {errors.name}
              </p>
            )}
          </div>
          <div className="category-field">
            <label htmlFor="category-sort-order">
              표시 순서 <span>필수</span>
            </label>
            <input
              id="category-sort-order"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={values.sortOrder}
              aria-required="true"
              aria-invalid={!!errors.sortOrder}
              aria-describedby={`category-sort-order-hint${errors.sortOrder ? ' category-sort-order-error' : ''}`}
              autoComplete="off"
              onChange={(event) =>
                onChange({ ...values, sortOrder: event.target.value })
              }
            />
            <p className="category-field__hint" id="category-sort-order-hint">
              0부터 2,147,483,647까지의 정수를 입력해 주세요.
            </p>
            {errors.sortOrder && (
              <p
                className="category-field__error"
                id="category-sort-order-error"
                role="alert"
              >
                {errors.sortOrder}
              </p>
            )}
          </div>
        </div>
        <p className="category-form__order-hint">
          숫자가 작을수록 먼저 표시됩니다. 같은 숫자를 사용할 수 있으며, 표시
          순서가 같으면 분류명 순으로 정렬됩니다.
        </p>
      </section>
      {original ? (
        <section
          className="category-panel"
          aria-labelledby="category-active-title"
        >
          <div className="category-panel__heading">
            <h2 id="category-active-title">활성 상태</h2>
            <p>
              활성 분류는 이용객의 새로운 이상사항 신고에서 선택할 수 있습니다.
            </p>
          </div>
          <label className="category-toggle" htmlFor="category-is-active">
            <input
              id="category-is-active"
              type="checkbox"
              checked={values.isActive}
              disabled={lockedActive}
              aria-describedby="category-active-hint"
              onChange={(event) =>
                onChange({ ...values, isActive: event.target.checked })
              }
            />
            분류 활성화
          </label>
          <p className="category-field__hint" id="category-active-hint">
            {lockedActive
              ? '활성 상태의 기본 분류는 비활성화할 수 없습니다.'
              : fallback
                ? '현재 비활성인 기본 분류를 다시 활성화할 수 있습니다.'
                : '비활성화해도 기존 이상사항과 당시 저장된 분류명은 유지됩니다. 필요할 때 다시 활성화할 수 있습니다.'}
          </p>
        </section>
      ) : (
        <p className="category-form__creation-note">
          새 분류는 활성 상태로 등록됩니다.
        </p>
      )}
    </fieldset>
  );
}
