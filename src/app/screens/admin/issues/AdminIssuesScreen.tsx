import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { useAdminPropertyOptions } from '../../../features/admin-properties/use-admin-property-options';
import type { AdminIssueFilters } from '../../../features/admin-issues/admin-issues.types';
import { Button } from '../../../shared/ui/Button/Button';
import { AdminListState } from '../components/AdminListState';
import { ScheduleIcon } from '../schedule/components/ScheduleIcon';
import { IssueFilters } from './components/IssueFilters';
import { IssueRows } from './components/IssueRows';
import { IssueDetailPanel } from './components/IssueDetailPanel';
import { useAdminIssues } from './hooks/use-admin-issues';
import {
  issueFilterErrors,
  issueSearch,
  readIssueFilters,
} from './model/issue-filters';
import '../styles/admin-directory.css';
import './styles/issue-list.css';

const statusShortcuts = [
  [undefined, '전체'],
  ['NEW', '신규'],
  ['IN_PROGRESS', '조치 중'],
  ['RESOLVED', '해결'],
] as const;

export function AdminIssuesScreen() {
  const { state, rejectSession } = useAdminSession();
  const { id } = useParams();
  if (state.status !== 'authenticated') return null;
  return (
    <IssuesWorkspace
      key={`${state.user.id}:${state.expiresAt}`}
      selectedId={id}
      token={state.token}
      adminId={state.user.id}
      rejectSession={rejectSession}
    />
  );
}

function IssuesWorkspace({
  selectedId,
  token,
  adminId,
  rejectSession,
}: {
  selectedId?: string;
  token: string;
  adminId: string;
  rejectSession: (token: string) => void;
}) {
  const [search, setSearch] = useSearchParams();
  const [filterReset, setFilterReset] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterFocus = useRef<{
    element: HTMLElement;
    target: string;
    query: string;
  } | null>(null);
  const filters = readIssueFilters(search);
  const query = issueSearch(filters);
  const invalid = Object.keys(issueFilterErrors(filters)).length > 0;
  const { resource, refresh } = useAdminIssues(
    filters,
    token,
    rejectSession,
    !invalid,
  );
  const properties = useAdminPropertyOptions(token, rejectSession);
  const expanded =
    filtersOpen || invalid || properties.resource.status === 'error';
  const appliedCount = [
    filters.propertyId,
    filters.isUrgent,
    filters.from,
    filters.to,
    filters.cancellation && filters.cancellation !== 'active'
      ? filters.cancellation
      : undefined,
  ].filter(Boolean).length;
  const correctedPage =
    resource.status === 'ready' &&
    filters.page > Math.max(1, resource.data.totalPages)
      ? Math.max(1, resource.data.totalPages)
      : null;
  const busy =
    !invalid && (resource.status === 'loading' || correctedPage !== null);
  useEffect(() => {
    if (correctedPage !== null)
      setSearch(
        issueSearch({
          ...readIssueFilters(new URLSearchParams(query)),
          page: correctedPage,
        }),
        { replace: true },
      );
  }, [correctedPage, query, setSearch]);
  useLayoutEffect(() => {
    const previous = filterFocus.current;
    if (!previous || previous.query !== query) return;
    filterFocus.current = null;
    if (
      !previous.element.isConnected &&
      document.activeElement === document.body
    ) {
      const field = document.getElementById(previous.target);
      const target = field?.getClientRects().length
        ? field
        : document.getElementById('issue-query-toggle');
      target?.focus({ preventScroll: true });
    }
  }, [query, filterReset]);
  function rememberFilterFocus(nextQuery: string) {
    filterFocus.current = null;
    const active = document.activeElement;
    if (active instanceof HTMLElement && active.closest('#issue-filters')) {
      filterFocus.current = {
        element: active,
        target: active.id || 'issue-filter-apply',
        query: nextQuery,
      };
    } else if (
      active instanceof HTMLButtonElement &&
      active.form?.id === 'issue-filters'
    ) {
      filterFocus.current = {
        element: active,
        target: 'issue-query-toggle',
        query: nextQuery,
      };
    }
  }
  function apply(input: AdminIssueFilters) {
    const next = issueSearch(input);
    rememberFilterFocus(next);
    if (next === query) refresh();
    else setSearch(next);
  }
  function reset() {
    rememberFilterFocus('');
    setFilterReset((value) => value + 1);
    if (query === '') refresh();
    else setSearch('');
  }
  return (
    <div
      className={`admin-directory admin-issues${selectedId ? ' admin-issues--selected' : ''}`}
    >
      <header className="issue-list-heading">
        <h1>이상사항</h1>
        <Link
          className="ui-button admin-button-secondary"
          to={appRoutes.adminIssueCategories}
        >
          분류 관리
        </Link>
      </header>
      <div className="issue-inbox-layout">
        <section className="issue-queue" aria-labelledby="issue-results-title">
          <div className="issue-status-shortcuts" aria-label="처리 상태">
            {statusShortcuts.map(([value, label]) => (
              <button
                key={label}
                type="button"
                aria-pressed={filters.status === value}
                onClick={() => apply({ ...filters, status: value, page: 1 })}
              >
                {label}
              </button>
            ))}
          </div>
          <header className="issue-results-heading">
            <h2 id="issue-results-title">
              이상사항{' '}
              {!invalid && !busy && resource.status === 'ready' && (
                <span id="issue-results-count" role="status">
                  {resource.data.total.toLocaleString('ko-KR')}건
                </span>
              )}
            </h2>
            <div className="issue-results-tools">
              <Button
                id="issue-query-toggle"
                className="issue-filter-toggle"
                aria-expanded={expanded}
                aria-controls="issue-query-body"
                onClick={() => setFiltersOpen((value) => !value)}
              >
                <ScheduleIcon name="filter" /> 필터
                {appliedCount > 0 && (
                  <span
                    className="issue-filter-applied"
                    aria-label="적용된 필터 있음"
                  />
                )}
              </Button>
              <Button
                className="issue-list-refresh"
                aria-label="이상사항 목록 새로고침"
                title="새로고침"
                disabled={busy}
                onClick={() => {
                  refresh();
                  properties.refresh();
                }}
              >
                <ScheduleIcon name="refresh" />
              </Button>
            </div>
          </header>
          <div id="issue-query-body" className="issue-query" hidden={!expanded}>
            <div className="issue-query__body">
              <IssueFilters
                key={`${query}:${filterReset}`}
                input={filters}
                properties={
                  properties.resource.status === 'ready'
                    ? properties.resource.data
                    : undefined
                }
                propertiesLoading={properties.resource.status === 'loading'}
                propertyError={properties.resource.status === 'error'}
                onApply={apply}
                onReset={reset}
              />
              {properties.resource.status === 'error' && (
                <div
                  role="alert"
                  className="issue-list-banner"
                  id="issue-properties-error"
                >
                  <p>
                    휴양소 목록을 불러오지 못했습니다.{' '}
                    {properties.resource.message}
                  </p>
                  <Button
                    className="admin-button-secondary"
                    onClick={properties.refresh}
                  >
                    다시 불러오기
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="issue-list-panel">
            {invalid ? (
              <AdminListState
                title="조회 조건을 확인해 주세요"
                description="표시된 항목을 수정한 뒤 조회해 주세요."
                error
              >
                <Button
                  className="admin-button-secondary"
                  type="reset"
                  form="issue-filters"
                >
                  조회 조건 초기화
                </Button>
              </AdminListState>
            ) : busy ? (
              <AdminListState
                title="이상사항을 불러오는 중"
                description=""
                loading
              />
            ) : resource.status === 'error' ? (
              <AdminListState
                title="이상사항을 불러오지 못했습니다"
                description={resource.message}
                error
              >
                <Button onClick={refresh}>다시 불러오기</Button>
              </AdminListState>
            ) : resource.status === 'ready' ? (
              <>
                {resource.data.items.length === 0 ? (
                  <AdminListState
                    title="조건에 맞는 이상사항이 없습니다"
                    description="휴양소나 조회 조건을 변경해 주세요."
                  >
                    <Button
                      className="admin-button-secondary"
                      type="reset"
                      form="issue-filters"
                    >
                      조회 조건 초기화
                    </Button>
                  </AdminListState>
                ) : (
                  <IssueRows
                    items={resource.data.items}
                    filters={filters}
                    selectedId={selectedId}
                  />
                )}
                {resource.data.totalPages > 1 && (
                  <nav
                    className="issue-list-pagination"
                    aria-label="이상사항 목록 페이지"
                  >
                    <Button
                      className="admin-button-secondary"
                      disabled={filters.page <= 1}
                      onClick={() =>
                        apply({ ...filters, page: filters.page - 1 })
                      }
                    >
                      이전
                    </Button>
                    <span aria-current="page">
                      {filters.page} / {resource.data.totalPages}
                    </span>
                    <Button
                      className="admin-button-secondary"
                      disabled={filters.page >= resource.data.totalPages}
                      onClick={() =>
                        apply({ ...filters, page: filters.page + 1 })
                      }
                    >
                      다음
                    </Button>
                  </nav>
                )}
              </>
            ) : null}
          </div>
        </section>
        <section
          className="issue-selected-panel"
          id="issue-detail-region"
          aria-label="이상사항 상세"
          tabIndex={-1}
        >
          {selectedId ? (
            <IssueDetailPanel
              key={selectedId}
              id={selectedId}
              token={token}
              adminId={adminId}
              rejectSession={rejectSession}
              returnTo={`${appRoutes.adminIssues}${query}`}
              onSaved={refresh}
            />
          ) : (
            <div className="issue-selection-empty">
              <ScheduleIcon name="arrow" />
              <h2>신고를 선택해 주세요</h2>
              <p>내용을 확인하고 조치를 기록하세요.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
