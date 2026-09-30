import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';
import { useAdminSession } from '../../../core/session/use-admin-session';
import type {
  AdminIssueCategoryDto,
  GetAdminIssueCategoriesInput,
} from '../../../features/admin-issue-categories/admin-issue-category.types';
import { Button } from '../../../shared/ui/Button/Button';
import { PageState } from '../../../shared/ui/PageState/PageState';
import { CategoryEditor } from './components/CategoryEditor';
import { CategoryFilterPanel } from './components/CategoryFilterPanel';
import { CategoryRows } from './components/CategoryRows';
import { useCategoryList } from './hooks/use-category-list';
import {
  categorySearch,
  readCategoryFilters,
} from './model/issue-category-model';
import './styles/issue-categories.css';

export function AdminIssueCategoriesScreen() {
  const { state, rejectSession } = useAdminSession();
  if (state.status !== 'authenticated') return null;
  return (
    <CategoryWorkspace
      key={`${state.user.id}:${state.expiresAt}`}
      token={state.token}
      rejectSession={rejectSession}
    />
  );
}
function CategoryWorkspace({
  token,
  rejectSession,
}: {
  token: string;
  rejectSession: (token: string) => void;
}) {
  const [query, setQuery] = useSearchParams();
  const [saved, setSaved] = useState<AdminIssueCategoryDto | null>(null);
  const notice = useRef<HTMLDivElement>(null);
  const search = query.toString();
  useEffect(() => {
    if (saved) notice.current?.focus();
  }, [saved]);
  return (
    <div className="category-workspace">
      {saved && (
        <div
          className="category-banner category-banner--success"
          role="status"
          ref={notice}
          tabIndex={-1}
        >
          <strong>{saved.name}</strong> 분류를 저장했습니다. 현재 조회 조건에
          따라 목록에서 보이지 않을 수 있습니다.
        </div>
      )}
      <CategoryPage
        key={`${search}:${token}`}
        search={search}
        token={token}
        rejectSession={rejectSession}
        onEditing={() => setSaved(null)}
        onSaved={setSaved}
        onQuery={(next, replace = false) => setQuery(next, { replace })}
      />
    </div>
  );
}
function CategoryPage({
  search,
  token,
  rejectSession,
  onEditing,
  onSaved,
  onQuery,
}: {
  search: string;
  token: string;
  rejectSession: (token: string) => void;
  onEditing: () => void;
  onSaved: (category: AdminIssueCategoryDto) => void;
  onQuery: (query: string, replace?: boolean) => void;
}) {
  const filters = readCategoryFilters(new URLSearchParams(search));
  const { resource, refresh } = useCategoryList(
    filters.input,
    token,
    rejectSession,
    !filters.error,
  );
  const [editor, setEditor] = useState<{
    original?: AdminIssueCategoryDto;
  } | null>(null);
  const [filterRevision, setFilterRevision] = useState(0);
  const correctedPage =
    !editor &&
    resource.status === 'ready' &&
    filters.input.page > Math.max(1, resource.data.totalPages)
      ? Math.max(1, resource.data.totalPages)
      : null;
  useEffect(() => {
    if (correctedPage !== null)
      onQuery(
        categorySearch({
          ...readCategoryFilters(new URLSearchParams(search)).input,
          page: correctedPage,
        }),
        true,
      );
  }, [correctedPage, search, onQuery]);
  function apply(input: GetAdminIssueCategoriesInput) {
    onEditing();
    const next = categorySearch(input);
    if (next === (search ? `?${search}` : '')) refresh();
    else onQuery(next);
  }
  function close() {
    setEditor(null);
    refresh();
    requestAnimationFrame(() =>
      document.getElementById('category-list-title')?.focus(),
    );
  }
  function reload() {
    setEditor(null);
    refresh();
    requestAnimationFrame(() =>
      document.getElementById('category-list-title')?.focus(),
    );
  }
  if (editor)
    return (
      <CategoryEditor
        original={editor.original}
        token={token}
        rejectSession={rejectSession}
        onClose={close}
        onReload={reload}
        onSaved={(category) => {
          onSaved(category);
          setEditor(null);
          refresh();
        }}
      />
    );
  return (
    <>
      <header className="category-heading">
        <div>
          <p className="category-heading__eyebrow">ISSUE CATEGORIES</p>
          <h1 id="category-list-title" tabIndex={-1}>
            이상사항 분류 관리
          </h1>
          <p>모든 휴양소에서 함께 사용할 신고 분류를 관리하세요.</p>
        </div>
        <div className="category-actions">
          <Link
            className="ui-button admin-button-secondary"
            to={appRoutes.adminIssues}
          >
            이상사항으로 돌아가기
          </Link>
          <Button
            onClick={() => {
              onEditing();
              setEditor({});
            }}
          >
            분류 등록
          </Button>
        </div>
      </header>
      <CategoryFilterPanel
        key={`${search}:${filterRevision}`}
        initial={filters.values}
        onApply={apply}
      />
      {filters.error ? (
        <div role="alert">
          <PageState
            title="조회 조건을 확인해 주세요"
            description={filters.error}
          >
            <Button
              onClick={() => {
                setFilterRevision((value) => value + 1);
                apply({ page: 1 });
              }}
            >
              조회 조건 초기화
            </Button>
          </PageState>
        </div>
      ) : resource.status === 'loading' || correctedPage !== null ? (
        <div role="status">
          <PageState
            title="분류 목록을 불러오는 중"
            description="등록된 분류와 사용 상태를 확인합니다."
          />
        </div>
      ) : resource.status === 'error' ? (
        <div role="alert">
          <PageState
            title="분류 목록을 불러오지 못했습니다"
            description={resource.message}
          >
            <Button onClick={refresh}>다시 불러오기</Button>
          </PageState>
        </div>
      ) : (
        <>
          <div className="category-count">
            <p>
              조회된 분류{' '}
              <strong>{resource.data.total.toLocaleString('ko-KR')}개</strong>
            </p>
            <Button className="admin-button-secondary" onClick={refresh}>
              새로고침
            </Button>
          </div>
          {!resource.data.items.length ? (
            <PageState
              title="조건에 맞는 분류가 없습니다"
              description="조회 조건을 변경하거나 새 분류를 등록해 주세요."
            >
              <Button
                className="admin-button-secondary"
                onClick={() => {
                  setFilterRevision((value) => value + 1);
                  apply({ page: 1 });
                }}
              >
                조회 조건 초기화
              </Button>
            </PageState>
          ) : (
            <CategoryRows
              items={resource.data.items}
              onEdit={(original) => {
                onEditing();
                setEditor({ original });
              }}
            />
          )}
          {resource.data.totalPages > 1 && (
            <nav className="category-pagination" aria-label="분류 목록 페이지">
              <Button
                className="admin-button-secondary"
                disabled={filters.input.page <= 1}
                onClick={() =>
                  apply({ ...filters.input, page: filters.input.page - 1 })
                }
              >
                이전
              </Button>
              <span aria-current="page">
                {filters.input.page} / {resource.data.totalPages} 페이지
              </span>
              <Button
                className="admin-button-secondary"
                disabled={filters.input.page >= resource.data.totalPages}
                onClick={() =>
                  apply({ ...filters.input, page: filters.input.page + 1 })
                }
              >
                다음
              </Button>
            </nav>
          )}
        </>
      )}
    </>
  );
}
