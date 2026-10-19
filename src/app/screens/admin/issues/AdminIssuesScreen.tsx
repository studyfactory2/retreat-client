import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { useAdminPropertyOptions } from '../../../features/admin-properties/use-admin-property-options';
import type { AdminIssueFilters } from '../../../features/admin-issues/admin-issues.types';
import { Button } from '../../../shared/ui/Button/Button';
import { AdminListState } from '../components/AdminListState';
import { AdminAppliedFilters } from '../components/AdminAppliedFilters';
import { ScheduleIcon } from '../schedule/components/ScheduleIcon';
import { IssueFilters } from './components/IssueFilters';
import { IssueRows } from './components/IssueRows';
import { issueAppliedSummary } from './model/issue-filter-summary';
import { useAdminIssues } from './hooks/use-admin-issues';
import {
  issueFilterErrors,
  issueCancellationLabel,
  issueSearch,
  readIssueFilters,
} from './model/issue-filters';
import '../styles/admin-directory.css';
import './styles/issue-list.css';

export function AdminIssuesScreen() {
  const { state, rejectSession } = useAdminSession();
  if (state.status !== 'authenticated') return null;
  return (
    <IssuesWorkspace
      key={`${state.user.id}:${state.expiresAt}`}
      token={state.token}
      rejectSession={rejectSession}
    />
  );
}
function IssuesWorkspace({ token, rejectSession }: {
  token: string;
  rejectSession: (token: string) => void;
}) {
  const [search, setSearch] = useSearchParams();
  const [filterReset, setFilterReset] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(
    () => !window.matchMedia('(max-width: 760px)').matches,
  );
  const filterFocus = useRef<{ element: HTMLElement; target: string; query: string } | null>(null);
  const filters = readIssueFilters(search);
  const query = issueSearch(filters);
  const invalid = Object.keys(issueFilterErrors(filters)).length > 0;
  const { resource, refresh } = useAdminIssues(filters, token, rejectSession, !invalid);
  const properties = useAdminPropertyOptions(token, rejectSession);
  const applied = issueAppliedSummary(
    filters,
    properties.resource.status === 'ready' ? properties.resource.data : undefined,
  );
  const correctedPage = resource.status === 'ready' && filters.page > Math.max(1, resource.data.totalPages)
    ? Math.max(1, resource.data.totalPages) : null;
  const busy = !invalid && (resource.status === 'loading' || correctedPage !== null);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)');
    const update = () => setFiltersOpen(!media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (correctedPage !== null) {
      setSearch(issueSearch({
        ...readIssueFilters(new URLSearchParams(query)), page: correctedPage,
      }), { replace: true });
    }
  }, [correctedPage, query, setSearch]);
  useLayoutEffect(() => {
    const previous = filterFocus.current;
    // Reset state and URL navigation may commit separately.
    if (!previous || previous.query !== query) return;
    filterFocus.current = null;
    if (!previous.element.isConnected && document.activeElement === document.body) {
      const field = document.getElementById(previous.target);
      const target = field?.getClientRects().length ? field : document.getElementById('issue-query-toggle');
      target?.focus({ preventScroll: true });
    }
  }, [query, filterReset]);
  function rememberFilterFocus(nextQuery: string) {
    filterFocus.current = null;
    const active = document.activeElement;
    if (active instanceof HTMLElement && active.closest('#issue-filters')) {
      filterFocus.current = { element: active, target: active.id || 'issue-filter-apply', query: nextQuery };
    } else if (active instanceof HTMLButtonElement && active.form?.id === 'issue-filters') {
      filterFocus.current = { element: active, target: 'issue-query-toggle', query: nextQuery };
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
    <div className="admin-directory admin-issues">
      <header className="issue-list-heading">
        <h1>이상사항</h1>
        <Link className="ui-button admin-button-secondary" to={appRoutes.adminIssueCategories}>
          분류 관리
        </Link>
      </header>
      <details className="issue-query"
        open={filtersOpen || invalid || properties.resource.status === 'error'}
        onToggle={(event) => setFiltersOpen(event.currentTarget.open)}>
        <summary id="issue-query-toggle">
          <span className="issue-query__label"><ScheduleIcon name="filter" /> 조회 조건</span>
          <span className="issue-query__scope">
            {invalid ? '조건 확인 필요' : <>
              <span>{applied[0].value} · {applied[1].value}</span>
              <span>{applied[4].value}</span>
            </>}
          </span>
          <ScheduleIcon name="chevron" />
        </summary>
        <div className="issue-query__body">
          <IssueFilters key={`${query}:${filterReset}`} input={filters}
            properties={properties.resource.status === 'ready' ? properties.resource.data : undefined}
            propertiesLoading={properties.resource.status === 'loading'}
            propertyError={properties.resource.status === 'error'}
            onApply={apply} onReset={reset} />
          {properties.resource.status === 'error' && (
            <div role="alert" className="issue-list-banner" id="issue-properties-error">
              <p>휴양소 목록을 불러오지 못했습니다. {properties.resource.message}</p>
              <Button className="admin-button-secondary" onClick={properties.refresh}>다시 불러오기</Button>
            </div>
          )}
        </div>
      </details>
      <section className="issue-list-panel" aria-labelledby="issue-results-title">
        <header className="issue-results-heading">
          <div>
            <h2 id="issue-results-title">이상사항{' '}
              {!invalid && !busy && resource.status === 'ready' && (
                <span id="issue-results-count" role="status">{resource.data.total.toLocaleString('ko-KR')}건</span>
              )}
            </h2>
            {!invalid && <p>{filters.cancellation === 'all' ? '취소 포함' : issueCancellationLabel(filters.cancellation)} · 접수일 최신순</p>}
          </div>
          <Button className="issue-list-refresh" aria-label="이상사항 새로고침" title="새로고침"
            disabled={busy} onClick={() => { refresh(); properties.refresh(); }}>
            <ScheduleIcon name="refresh" />
          </Button>
        </header>
        {invalid ? (
          <AdminListState title="조회 조건을 확인해 주세요" description="표시된 항목을 수정한 뒤 조회해 주세요." error>
            <Button className="admin-button-secondary" type="reset" form="issue-filters">조회 조건 초기화</Button>
          </AdminListState>
        ) : busy ? (
          <AdminListState title="이상사항을 불러오는 중" description="조회 조건에 맞는 기록을 확인하고 있습니다." loading />
        ) : resource.status === 'error' ? (
          <AdminListState title="이상사항을 불러오지 못했습니다" description={resource.message} error>
            <Button onClick={refresh}>다시 불러오기</Button>
          </AdminListState>
        ) : resource.status === 'ready' ? (
          <>
            {resource.data.items.length === 0 ? (
              <AdminListState title="조건에 맞는 이상사항이 없습니다" description="휴양소나 조회 조건을 변경해 주세요.">
                <Button className="admin-button-secondary" type="reset" form="issue-filters">조회 조건 초기화</Button>
              </AdminListState>
            ) : <IssueRows items={resource.data.items} filters={filters} />}
            {resource.data.totalPages > 1 && (
              <nav className="issue-list-pagination" aria-label="이상사항 목록 페이지">
                <Button className="admin-button-secondary" disabled={filters.page <= 1}
                  onClick={() => apply({ ...filters, page: filters.page - 1 })}>이전</Button>
                <span aria-current="page">{filters.page} / {resource.data.totalPages} 페이지</span>
                <Button className="admin-button-secondary" disabled={filters.page >= resource.data.totalPages}
                  onClick={() => apply({ ...filters, page: filters.page + 1 })}>다음</Button>
              </nav>
            )}
          </>
        ) : null}
      </section>
      <details className="issue-list-guide">
        <summary>조회 안내</summary>
        <div>
          <p>접수일은 한국 시간 기준입니다. 취소된 신고의 처리 상태와 기록은 보존됩니다.</p>
          {!invalid && <AdminAppliedFilters items={applied} />}
        </div>
      </details>
    </div>
  );
}
