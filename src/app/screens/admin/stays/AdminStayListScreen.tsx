import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { useAdminPropertyOptions } from '../../../features/admin-properties/use-admin-property-options';
import type { GetAdminStaysInput } from '../../../features/admin-stays/admin-stay-management.types';
import { Button } from '../../../shared/ui/Button/Button';
import { PageState } from '../../../shared/ui/PageState/PageState';
import { StayListCard } from './components/StayListCard';
import { StayListFilters } from './components/StayListFilters';
import { StayViewNavigation } from './components/StayViewNavigation';
import { readStayListFilters, stayListSearch } from './model/stay-list-model';
import { useAdminStays } from './hooks/use-admin-stays';
import './styles/stay-list.css';

export function AdminStayListScreen() {
  const { state, rejectSession } = useAdminSession();
  if (state.status !== 'authenticated') return null;
  return (
    <StayListWorkspace
      key={`${state.user.id}:${state.expiresAt}`}
      token={state.token}
      rejectSession={rejectSession}
    />
  );
}

function StayListWorkspace({
  token,
  rejectSession,
}: {
  token: string;
  rejectSession: (token: string) => void;
}) {
  const [search, setSearch] = useSearchParams();
  const filters = readStayListFilters(search);
  const returnSearch = stayListSearch(filters);
  const detailSearch = `?view=list${returnSearch ? `&${returnSearch.slice(1)}` : ''}`;
  const createHref = `${appRoutes.adminStayCreate}${detailSearch}`;
  const calendarSearch = filters.propertyId
    ? `?${new URLSearchParams({ propertyId: filters.propertyId })}`
    : '';
  const { resource, refresh } = useAdminStays(filters, token, rejectSession);
  const propertyOptions = useAdminPropertyOptions(token, rejectSession);
  const correctedPage =
    resource.status === 'ready' &&
    filters.page > Math.max(1, resource.data.totalPages)
      ? Math.max(1, resource.data.totalPages)
      : null;
  const filtered = !!filters.search || !!filters.propertyId || !!filters.status;

  useEffect(() => {
    if (correctedPage !== null) {
      setSearch(
        stayListSearch({
          ...readStayListFilters(new URLSearchParams(returnSearch)),
          page: correctedPage,
        }),
        { replace: true },
      );
    }
  }, [correctedPage, returnSearch, setSearch]);

  function applyFilters(next: GetAdminStaysInput) {
    setSearch(stayListSearch(next));
  }

  return (
    <div className="admin-stay-list">
      <header className="stay-list-heading">
        <div>
          <p className="stay-list-heading__eyebrow">이용 일정 관리</p>
          <h1>이용 일정 목록</h1>
          <p>이용객과 휴양소별 일정을 확인하고 취소된 기록도 찾아보세요.</p>
        </div>
        <div className="stay-list-heading__actions">
          <Link
            className="ui-button admin-button-secondary"
            to={appRoutes.adminStayImportCreate}
          >
            엑셀 가져오기
          </Link>
          <Link className="ui-button" to={createHref}>
            이용 일정 등록
          </Link>
          <Button
            className="admin-button-secondary"
            disabled={resource.status === 'loading'}
            onClick={() => {
              refresh();
              propertyOptions.refresh();
            }}
          >
            새로고침
          </Button>
        </div>
      </header>
      <StayViewNavigation
        view="list"
        calendarHref={`${appRoutes.adminCalendar}${calendarSearch}`}
        listHref={`${appRoutes.adminStays}${returnSearch}`}
      />
      <StayListFilters
        key={returnSearch}
        input={filters}
        properties={
          propertyOptions.resource.status === 'ready'
            ? propertyOptions.resource.data
            : undefined
        }
        propertiesLoading={propertyOptions.resource.status === 'loading'}
        onApply={applyFilters}
      />
      {propertyOptions.resource.status === 'error' && (
        <div className="stay-list-banner" role="alert">
          <p id="stay-list-properties-error">
            휴양소 선택 목록을 불러오지 못했습니다.{' '}
            {propertyOptions.resource.message}
          </p>
          <Button
            className="admin-button-secondary"
            onClick={propertyOptions.refresh}
          >
            휴양소 다시 불러오기
          </Button>
        </div>
      )}
      {resource.status === 'loading' || correctedPage !== null ? (
        <div role="status">
          <PageState
            title="이용 일정을 불러오는 중"
            description="조회 조건에 맞는 일정을 확인하고 있습니다."
          />
        </div>
      ) : resource.status === 'error' ? (
        <div role="alert">
          <PageState
            title="이용 일정 목록을 불러오지 못했습니다"
            description={resource.message}
          >
            <Button onClick={refresh}>다시 불러오기</Button>
          </PageState>
        </div>
      ) : (
        <>
          <div className="stay-list-summary" role="status">
            <p>
              {filtered ? '조회 결과' : '전체 일정'}{' '}
              <strong>{resource.data.total.toLocaleString('ko-KR')}건</strong>
            </p>
            <span>
              입·퇴실 예정 시간은 한국 시간 기준이며, 실제 입·퇴실 여부를
              나타내지 않습니다.
            </span>
          </div>
          {resource.data.items.length === 0 ? (
            <PageState
              title={
                filtered
                  ? '조건에 맞는 이용 일정이 없습니다'
                  : '등록된 이용 일정이 없습니다'
              }
              description={
                filtered
                  ? '검색어나 휴양소, 일정 상태를 변경해 다시 조회해 주세요.'
                  : '휴양소를 이용할 일정을 등록해 주세요.'
              }
            >
              {filtered ? (
                <Button onClick={() => applyFilters({ page: 1 })}>
                  조회 조건 초기화
                </Button>
              ) : (
                <Link className="ui-button" to={createHref}>
                  이용 일정 등록
                </Link>
              )}
            </PageState>
          ) : (
            <ul className="stay-list-grid" aria-label="이용 일정 목록">
              {resource.data.items.map((stay) => (
                <li key={stay.id}>
                  <StayListCard
                    stay={stay}
                    detailHref={`/admin/stays/${stay.id}${detailSearch}`}
                  />
                </li>
              ))}
            </ul>
          )}
          {resource.data.totalPages > 1 && (
            <nav
              className="stay-list-pagination"
              aria-label="이용 일정 목록 페이지"
            >
              <Button
                className="admin-button-secondary"
                disabled={filters.page <= 1}
                onClick={() =>
                  applyFilters({ ...filters, page: filters.page - 1 })
                }
              >
                이전
              </Button>
              <span aria-current="page">
                {filters.page} / {resource.data.totalPages} 페이지
              </span>
              <Button
                className="admin-button-secondary"
                disabled={filters.page >= resource.data.totalPages}
                onClick={() =>
                  applyFilters({ ...filters, page: filters.page + 1 })
                }
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
