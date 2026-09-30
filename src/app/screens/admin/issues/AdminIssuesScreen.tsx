import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { useAdminPropertyOptions } from '../../../features/admin-properties/use-admin-property-options';
import type { AdminIssueFilters } from '../../../features/admin-issues/admin-issues.types';
import { Button } from '../../../shared/ui/Button/Button';
import { PageState } from '../../../shared/ui/PageState/PageState';
import { IssueFilters } from './components/IssueFilters';
import { IssueRows } from './components/IssueRows';
import { useAdminIssues } from './hooks/use-admin-issues';
import {
  issueFilterErrors,
  issueSearch,
  readIssueFilters,
} from './model/issue-filters';
import { issueStatusLabel } from './model/issue-presentation';
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
function IssuesWorkspace({
  token,
  rejectSession,
}: {
  token: string;
  rejectSession: (token: string) => void;
}) {
  const [search, setSearch] = useSearchParams();
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
  const correctedPage =
    resource.status === 'ready' &&
    filters.page > Math.max(1, resource.data.totalPages)
      ? Math.max(1, resource.data.totalPages)
      : null;
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
  function apply(input: AdminIssueFilters) {
    const next = issueSearch(input);
    if (next === query) refresh();
    else setSearch(next);
  }
  return (
    <div className="admin-issues">
      <header className="issue-list-heading">
        <div>
          <p className="issue-list-eyebrow">휴양소 운영 관리</p>
          <h1>이상사항</h1>
          <p>접수된 불편사항과 사진, 그동안의 처리 기록을 확인하세요.</p>
        </div>
        <div className="issue-list-heading__actions">
          <Link
            className="ui-button admin-button-secondary"
            to={appRoutes.adminIssueCategories}
          >
            분류 관리
          </Link>
          <Button
            className="admin-button-secondary"
            disabled={!invalid && resource.status === 'loading'}
            onClick={() => {
              refresh();
              properties.refresh();
            }}
          >
            새로고침
          </Button>
        </div>
      </header>
      <IssueFilters
        key={query}
        input={filters}
        properties={
          properties.resource.status === 'ready'
            ? properties.resource.data
            : undefined
        }
        propertiesLoading={properties.resource.status === 'loading'}
        onApply={apply}
      />
      {properties.resource.status === 'error' && (
        <div role="alert" className="issue-list-banner">
          <p>
            휴양소 선택 목록을 불러오지 못했습니다.{' '}
            {properties.resource.message}
          </p>
          <Button
            className="admin-button-secondary"
            onClick={properties.refresh}
          >
            휴양소 다시 불러오기
          </Button>
        </div>
      )}
      {invalid ? (
        <div role="alert">
          <PageState
            title="조회 조건을 확인해 주세요"
            description="표시된 항목을 수정한 뒤 다시 조회해 주세요."
          />
        </div>
      ) : resource.status === 'loading' || correctedPage !== null ? (
        <div role="status">
          <PageState
            title="이상사항을 불러오는 중"
            description="조건에 맞는 신고 기록을 확인하고 있습니다."
          />
        </div>
      ) : resource.status === 'error' ? (
        <div role="alert">
          <PageState
            title="이상사항을 불러오지 못했습니다"
            description={resource.message}
          >
            <Button onClick={refresh}>다시 불러오기</Button>
          </PageState>
        </div>
      ) : (
        <>
          <div className="issue-list-summary" role="status">
            <p>
              {filters.status === 'NEW' ||
              filters.status === 'IN_PROGRESS' ||
              filters.status === 'RESOLVED'
                ? issueStatusLabel(filters.status)
                : '전체 상태'}{' '}
              · 조회된 신고{' '}
              <strong>{resource.data.total.toLocaleString('ko-KR')}건</strong>
            </p>
            <span>취소된 신고 제외 · 접수일 최신순</span>
          </div>
          {resource.data.items.length === 0 ? (
            <PageState
              title="조건에 맞는 이상사항이 없습니다"
              description="휴양소와 조회 조건을 변경하거나, 새 신고가 접수된 뒤 다시 확인해 주세요."
            >
              <Button
                className="admin-button-secondary"
                onClick={() => apply({ page: 1 })}
              >
                조회 조건 초기화
              </Button>
            </PageState>
          ) : (
            <IssueRows items={resource.data.items} filters={filters} />
          )}
          {resource.data.totalPages > 1 && (
            <nav
              className="issue-list-pagination"
              aria-label="이상사항 목록 페이지"
            >
              <Button
                className="admin-button-secondary"
                disabled={filters.page <= 1}
                onClick={() => apply({ ...filters, page: filters.page - 1 })}
              >
                이전
              </Button>
              <span aria-current="page">
                {filters.page} / {resource.data.totalPages} 페이지
              </span>
              <Button
                className="admin-button-secondary"
                disabled={filters.page >= resource.data.totalPages}
                onClick={() => apply({ ...filters, page: filters.page + 1 })}
              >
                다음
              </Button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
