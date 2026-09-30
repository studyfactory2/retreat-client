import { useEffect, useRef, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import {
  createAdminIssueCategory,
  updateAdminIssueCategory,
} from '../../../../features/admin-issue-categories/admin-issue-category-api';
import type { AdminIssueCategoryDto } from '../../../../features/admin-issue-categories/admin-issue-category.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { useCategoryNavigation } from '../hooks/use-category-navigation';
import { useCategorySave } from '../hooks/use-category-save';
import {
  buildCreateCategoryInput,
  buildUpdateCategoryInput,
  createCategoryValues,
  validateCategoryForm,
  type CategoryFormValues,
  type CategoryFormErrors,
} from '../model/issue-category-model';
import { CategoryForm } from './CategoryForm';
import { CategoryReview } from './CategoryReview';
import { CategoryNavigationNotice } from './CategoryNavigationNotice';

export function CategoryEditor({
  original,
  token,
  rejectSession,
  onClose,
  onReload,
  onSaved,
}: {
  original?: AdminIssueCategoryDto;
  token: string;
  rejectSession: (token: string) => void;
  onClose: () => void;
  onReload: () => void;
  onSaved: (category: AdminIssueCategoryDto) => void;
}) {
  const [initial] = useState(() => createCategoryValues(original));
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<CategoryFormErrors>({});
  const [reviewing, setReviewing] = useState(false);
  const [unchanged, setUnchanged] = useState(false);
  const mutation = useCategorySave(token, rejectSession);
  const dirty =
    values.name !== initial.name ||
    values.sortOrder !== initial.sortOrder ||
    values.isActive !== initial.isActive;
  const navigation = useCategoryNavigation(dirty, mutation.state.busy);
  const blocked =
    mutation.state.busy || !!mutation.state.blocked || !!navigation.pending;
  const notice = useRef<HTMLDivElement>(null);
  useEffect(() => {
    document.getElementById('category-editor-title')?.focus();
  }, []);
  useEffect(() => {
    if (mutation.state.message) notice.current?.focus();
  }, [mutation.state.message]);

  function change(next: CategoryFormValues) {
    if (blocked || reviewing) return;
    setValues(next);
    setErrors({});
    setUnchanged(false);
    mutation.clearError();
  }
  function review() {
    if (blocked || reviewing) return;
    const validation = validateCategoryForm(values, original);
    setErrors(validation);
    if (Object.keys(validation).length) {
      requestAnimationFrame(() =>
        document
          .getElementById(
            validation.name ? 'category-name' : 'category-sort-order',
          )
          ?.focus(),
      );
      return;
    }
    if (original && !buildUpdateCategoryInput(original, values)) {
      setUnchanged(true);
      return;
    }
    setReviewing(true);
  }
  function save() {
    if (
      !reviewing ||
      blocked ||
      Object.keys(validateCategoryForm(values, original)).length
    )
      return;
    const update = original ? buildUpdateCategoryInput(original, values) : null;
    if (original && !update) return;
    void mutation.save(async (signal) => {
      const saved =
        original && update
          ? await updateAdminIssueCategory(original.id, update, token, signal)
          : await createAdminIssueCategory(
              buildCreateCategoryInput(values),
              token,
              signal,
            );
      if (
        original &&
        (saved.id !== original.id ||
          saved.createdAt !== original.createdAt ||
          saved.isFallback !== original.isFallback ||
          Date.parse(saved.updatedAt) <= Date.parse(original.updatedAt) ||
          (update?.name === undefined && saved.name !== original.name) ||
          (update?.sortOrder === undefined &&
            saved.sortOrder !== original.sortOrder) ||
          (update?.isActive === undefined &&
            saved.isActive !== original.isActive))
      )
        throw new ApiRequestError(
          '저장된 분류 정보를 확인할 수 없습니다. 목록을 다시 불러와 주세요.',
          200,
          'INVALID_ISSUE_CATEGORY_RESPONSE',
        );
      return saved;
    }, onSaved);
  }
  function editAgain() {
    if (mutation.state.busy) return;
    setReviewing(false);
    requestAnimationFrame(() =>
      document.getElementById('category-review-button')?.focus(),
    );
  }
  return (
    <div className="category-editor">
      <header className="category-heading">
        <div>
          <p className="category-heading__eyebrow">ISSUE CATEGORY</p>
          <h1 id="category-editor-title" tabIndex={-1}>
            {original ? '분류 정보 수정' : '새 분류 등록'}
          </h1>
          <p>
            {original
              ? `${original.name}의 표시 정보를 관리하세요.`
              : '이용객이 신고할 때 선택할 분류를 추가하세요.'}
          </p>
        </div>
        <div className="category-actions">
          <Button
            className="admin-button-secondary"
            disabled={mutation.state.busy || !!navigation.pending}
            onClick={() => navigation.request('return', onClose)}
          >
            분류 목록으로
          </Button>
        </div>
      </header>
      {navigation.pending && (
        <CategoryNavigationNotice
          reload={navigation.pending === 'reload'}
          onKeep={navigation.keep}
          onProceed={navigation.proceed}
        />
      )}
      {mutation.state.message && (
        <div
          className="category-banner category-banner--error"
          role="alert"
          tabIndex={-1}
          ref={notice}
        >
          <p>{mutation.state.message}</p>
          {mutation.state.blocked && (
            <Button
              className="admin-button-secondary"
              disabled={!!navigation.pending}
              onClick={() => navigation.request('reload', onReload)}
            >
              목록에서 최신 정보 확인
            </Button>
          )}
        </div>
      )}
      {unchanged && (
        <p className="category-banner" role="status">
          변경된 내용이 없습니다.
        </p>
      )}
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          review();
        }}
      >
        <CategoryForm
          values={values}
          onChange={change}
          errors={errors}
          original={original}
          disabled={blocked || reviewing}
        />
        {!reviewing && (
          <div className="category-actions category-save-actions">
            <Button
              id="category-review-button"
              type="submit"
              disabled={blocked}
            >
              저장 내용 확인
            </Button>
          </div>
        )}
      </form>
      {reviewing && (
        <CategoryReview
          values={values}
          original={original}
          onBack={editAgain}
          onConfirm={save}
          busy={mutation.state.busy}
          disabled={blocked}
        />
      )}
    </div>
  );
}
