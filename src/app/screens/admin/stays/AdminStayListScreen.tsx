import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { useAdminPropertyOptions } from '../../../features/admin-properties/use-admin-property-options';
import type { GetAdminStaysInput } from '../../../features/admin-stays/admin-stay-management.types';
import { Button } from '../../../shared/ui/Button/Button';
import { AdminListState } from '../components/AdminListState';
import { AdminListPagination } from '../components/AdminListPagination';
import { StayListCard } from './components/StayListCard';
import { StayListFilters } from './components/StayListFilters';
import { StayViewNavigation } from './components/StayViewNavigation';
import { readStayListFilters, stayListSearch } from './model/stay-list-model';
import { useAdminStays } from './hooks/use-admin-stays';
import '../styles/admin-directory.css';
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
    <div className="admin-stay-list admin-directory">
      <header className="stay-list-heading">
        <div>
          <h1>전체 일정</h1>
        </div>
        <div className="stay-list-heading__actions">
          <Link
            className="ui-button admin-button-secondary"
            to={appRoutes.adminStayImportCreate}
          >
            엑셀 가져오기
          </Link>
          <Link className="ui-button" to={createHref}>
            일정 등록
          </Link>
        </div>
      </header>
      <StayViewNavigation
        view="records"
        calendarHref={`${appRoutes.adminCalendar}${calendarSearch}`}
        listHref={`${appRoutes.adminCalendar}?view=schedule-list${filters.propertyId ? `&propertyId=${filters.propertyId}` : ''}`}
        recordsHref={`${appRoutes.adminStays}${returnSearch}`}
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
          <AdminListState
            title="이용 일정을 불러오는 중"
            description="조회 조건에 맞는 일정을 확인하고 있습니다."
            loading
          />
        </div>
      ) : resource.status === 'error' ? (
        <div role="alert">
          <AdminListState
            title="이용 일정 목록을 불러오지 못했습니다"
            description={resource.message}
            error
          >
            <Button onClick={refresh}>다시 불러오기</Button>
          </AdminListState>
        </div>
      ) : (
        <>
          <section
            className="stay-records-panel"
            aria-labelledby="stay-records-title"
          >
            <header className="stay-records-panel__header">
              <h2 id="stay-records-title">
                이용 일정{' '}
                <span
                  role="status"
                  aria-label={`${filtered ? '조회 결과' : '전체 일정'} ${resource.data.total.toLocaleString('ko-KR')}건`}
                >
                  {resource.data.total.toLocaleString('ko-KR')}건
                </span>
              </h2>
              <Button
                className="stay-records-refresh"
                aria-label="이용 일정 새로고침"
                onClick={() => {
                  refresh();
                  propertyOptions.refresh();
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 7v5h-5M4 17v-5h5" />
                  <path d="M6 7a7 7 0 0 1 11.8-2L20 8M4 16l2.2 3A7 7 0 0 0 18 17" />
                </svg>
              </Button>
            </header>
            {resource.data.items.length === 0 ? (
              <AdminListState
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
              </AdminListState>
            ) : (
              <div className="stay-records-table">
                <div className="stay-records-table__head" aria-hidden="true">
                  <span>이용객</span>
                  <span>휴양소</span>
                  <span>이용 기간</span>
                  <span>상태</span>
                  <span />
                </div>
                <ul
                  className="stay-records-table__rows"
                  role="list"
                  aria-label="이용 일정 목록"
                >
                  {resource.data.items.map((stay) => (
                    <li key={stay.id}>
                      <StayListCard
                        stay={stay}
                        detailHref={`/admin/stays/${stay.id}${detailSearch}`}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <AdminListPagination
              label="이용 일정 목록 페이지"
              page={filters.page}
              totalPages={resource.data.totalPages}
              onPage={(page) => applyFilters({ ...filters, page })}
            />
          </section>
          <details className="stay-records-note">
            <summary>일정 표시 안내</summary>
            <p>등록된 일정과 실제 입·퇴실 여부는 다릅니다.</p>
            <p>
              입·퇴실 예정 시간은 한국 시간 기준입니다. 체크리스트 제출 여부는
              일정 현황에서 확인하세요.
            </p>
          </details>
        </>
      )}
    </div>
  );
}
