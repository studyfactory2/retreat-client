import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';
import { useAdminSession } from '../../../core/session/use-admin-session';
import {
  formatSeoulUpdatedAt,
  getSeoulToday,
} from '../../../core/dates/seoul-date';
import { useAdminPropertyOptions } from '../../../features/admin-properties/use-admin-property-options';
import { Button } from '../../../shared/ui/Button/Button';
import { AdminListPagination } from '../components/AdminListPagination';
import { AdminListState } from '../components/AdminListState';
import { getMonthRange } from '../calendar/model/calendar-model';
import { StayViewNavigation } from '../stays/components/StayViewNavigation';
import { getScheduleViewSearch } from '../stays/model/stay-navigation';
import { ScheduleFilters } from './components/ScheduleFilters';
import { ScheduleRow } from './components/ScheduleRow';
import { useScheduleList } from './hooks/use-schedule-list';
import {
  readScheduleListFilters,
  scheduleListSearch,
  type ScheduleListFilters,
} from './model/schedule-list-model';
import '../styles/admin-directory.css';
import './styles/schedule-list.css';

export function AdminScheduleListScreen() {
  const { state, rejectSession } = useAdminSession();
  if (state.status !== 'authenticated') return null;
  return (
    <ScheduleWorkspace
      key={`${state.user.id}:${state.expiresAt}`}
      token={state.token}
      rejectSession={rejectSession}
    />
  );
}

function ScheduleWorkspace({
  token,
  rejectSession,
}: {
  token: string;
  rejectSession: (token: string) => void;
}) {
  const [initialDate] = useState(getSeoulToday);
  const [search, setSearch] = useSearchParams();
  const location = useLocation();
  const { filters, error } = readScheduleListFilters(search, initialDate);
  const returnSearch = scheduleListSearch(filters);
  const viewContext = getScheduleViewSearch(search, initialDate);
  const { resource, refresh } = useScheduleList(
    filters,
    !error,
    token,
    rejectSession,
  );
  const properties = useAdminPropertyOptions(token, rejectSession);
  const options =
    properties.resource.status === 'ready'
      ? properties.resource.data
      : undefined;
  const selectedProperty = options?.find(
    (property) => property.id === filters.propertyId,
  );
  const data = resource.status === 'ready' ? resource.data : undefined;
  const correctedPage =
    data && filters.page > Math.max(1, data.totalPages)
      ? Math.max(1, data.totalPages)
      : null;
  const notice: unknown = location.state;
  const saved =
    typeof notice === 'object' && notice !== null && 'stayNotice' in notice
      ? notice.stayNotice
      : undefined;

  useEffect(() => {
    if (correctedPage !== null) {
      const next = new URLSearchParams(returnSearch);
      if (correctedPage === 1) next.delete('page');
      else next.set('page', String(correctedPage));
      setSearch(next, { replace: true });
    }
  }, [correctedPage, returnSearch, setSearch]);

  function select(next: ScheduleListFilters) {
    setSearch(scheduleListSearch(next));
  }
  function selectPage(page: number) {
    const summary = document.getElementById('schedule-results-summary');
    summary?.focus({ preventScroll: true });
    summary?.scrollIntoView({ block: 'start' });
    select({ ...filters, page });
  }
  function reset() {
    const next: ScheduleListFilters = {
      date: filters.date,
      ...getMonthRange(filters.date.slice(0, 7)),
      page: 1,
    };
    select(next);
    return next;
  }

  return (
    <div className="admin-directory admin-schedule">
      <header className="admin-directory-heading schedule-heading">
        <div>
          <h1>이용 일정</h1>
        </div>
        <div className="schedule-heading__actions">
          <Link
            className="ui-button admin-button-secondary"
            to={appRoutes.adminStayImportCreate}
          >
            엑셀 가져오기
          </Link>
          <Link
            className="ui-button"
            to={appRoutes.adminStayCreate + returnSearch}
          >
            일정 등록
          </Link>
        </div>
      </header>
      <StayViewNavigation
        view="list"
        listHref={appRoutes.adminCalendar + returnSearch}
        calendarHref={appRoutes.adminCalendar + viewContext.calendarSearch}
        recordsHref={
          appRoutes.adminStays +
          (filters.propertyId
            ? `?${new URLSearchParams({ propertyId: filters.propertyId })}`
            : '')
        }
      />
      {(saved === 'created' || saved === 'updated') && (
        <p className="admin-directory-notice" role="status">
          {saved === 'created'
            ? '새 이용 일정이 등록되었습니다.'
            : '이용 일정이 수정되었습니다.'}
        </p>
      )}
      <ScheduleFilters
        key={returnSearch}
        input={filters}
        properties={options}
        loading={properties.resource.status === 'loading'}
        propertyError={properties.resource.status === 'error'}
        onApply={select}
        onReset={reset}
      />
      {properties.resource.status === 'error' && (
        <div
          className="schedule-error"
          role="alert"
          id="schedule-property-error"
        >
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
      {error ? (
        <AdminListState
          title="조회 조건을 확인해 주세요"
          description={error}
          error
        >
          <Button
            type="reset"
            form="schedule-filters"
            className="admin-button-secondary"
          >
            조회 조건 초기화
          </Button>
        </AdminListState>
      ) : (
        <>
          <div
            className="schedule-summary"
            id="schedule-results-summary"
            tabIndex={-1}
            aria-label="일정 조회 결과"
          >
            <div>
              <p className="schedule-summary__scope">
                <strong>
                  {selectedProperty?.name ??
                    (filters.propertyId ? '선택한 휴양소' : '전체 휴양소')}
                </strong>
                <span>
                  {filters.from.replaceAll('-', '.')} ~{' '}
                  {filters.to.replaceAll('-', '.')}
                </span>
              </p>
              <p role="status">
                {data && correctedPage === null ? (
                  <>
                    기간 내 일정{' '}
                    <strong>{data.total.toLocaleString('ko-KR')}건</strong>
                    <span className="schedule-summary__updated">
                      {' '}
                      · 최근 조회{' '}
                      <time dateTime={data.asOf}>
                        {formatSeoulUpdatedAt(data.asOf)}
                      </time>
                    </span>
                  </>
                ) : resource.status === 'error' ? (
                  '일정 조회를 다시 시도해 주세요.'
                ) : (
                  '일정을 불러오고 있습니다…'
                )}
              </p>
            </div>
            <Button
              className="schedule-button-quiet"
              onClick={refresh}
              disabled={resource.status === 'loading' || correctedPage !== null}
            >
              새로고침
            </Button>
          </div>
          {resource.status === 'loading' || correctedPage !== null ? (
            <AdminListState
              title="이용 일정을 불러오는 중"
              description="조회 조건에 맞는 일정을 확인하고 있습니다."
              loading
            />
          ) : resource.status === 'error' ? (
            <AdminListState
              title="이용 일정을 불러오지 못했습니다"
              description={resource.message}
              error
            >
              <Button className="admin-button-secondary" onClick={refresh}>
                다시 불러오기
              </Button>
            </AdminListState>
          ) : (
            <>
              {resource.data.items.length === 0 ? (
                <AdminListState
                  title="조건에 맞는 이용 일정이 없습니다"
                  description="기간이나 휴양소를 변경해 다시 조회해 주세요."
                >
                  <Button
                    type="reset"
                    form="schedule-filters"
                    className="admin-button-secondary"
                  >
                    조회 조건 초기화
                  </Button>
                </AdminListState>
              ) : (
                <section
                  className="schedule-table"
                  aria-label="예정 일정과 체크리스트 현황"
                >
                  <div className="schedule-table__head" aria-hidden="true">
                    <span>휴양소 · 이용객</span>
                    <span>예정 일시</span>
                    <span>체크리스트</span>
                    <span>관리</span>
                  </div>
                  <ul className="schedule-rows" role="list">
                    {resource.data.items.map((stay) => (
                      <li key={stay.id}>
                        <ScheduleRow
                          stay={stay}
                          detailHref={`${appRoutes.adminStays}/${stay.id}${returnSearch}`}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              <AdminListPagination
                label="일정 현황 목록 페이지"
                page={filters.page}
                totalPages={resource.data.totalPages}
                onPage={selectPage}
              />
            </>
          )}
          <details className="schedule-footnote">
            <summary>일정 표시 안내</summary>
            <p>
            취소되지 않은 예정 일정이며 비활성 휴양소도 포함됩니다. 체크리스트
            제출은 실제 입·퇴실이나 정비 완료를 뜻하지 않습니다. 과거 날짜도
            현재 제출 내역을 반영합니다.
            </p>
          </details>
        </>
      )}
    </div>
  );
}
