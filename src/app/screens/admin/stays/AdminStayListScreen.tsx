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
          <h1>전체·취소 기록</h1>
          <p>이용객으로 검색하거나 취소된 일정을 확인하세요.</p>
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
          <div className="stay-list-summary" role="status">
            <p>
              {filtered ? '조회 결과' : '전체·취소 기록'}{' '}
              <strong>{resource.data.total.toLocaleString('ko-KR')}건</strong>
            </p>
            <span>등록된 일정과 실제 입·퇴실 여부는 다릅니다.</span>
          </div>
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
            <section
              className="admin-directory-table"
              aria-label="이용 일정 기록"
            >
              <div className="admin-directory-table-head" aria-hidden="true">
                <span>휴양소 · 이용객</span>
                <div className="admin-directory-fields">
                  <span>입실 예정</span>
                  <span>퇴실 예정</span>
                </div>
                <span>일정 상태</span>
                <span>관리</span>
              </div>
              <ul
                className="admin-directory-rows"
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
            </section>
          )}
          <p className="admin-directory-footnote">
            입·퇴실 예정 시간은 한국 시간 기준입니다. 체크리스트 제출 여부는
            일정 현황에서 확인하세요.
          </p>
          <AdminListPagination
            label="이용 일정 목록 페이지"
            page={filters.page}
            totalPages={resource.data.totalPages}
            onPage={(page) => applyFilters({ ...filters, page })}
          />
        </>
      )}
    </div>
  );
}
