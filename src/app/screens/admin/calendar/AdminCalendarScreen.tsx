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
import { CalendarFilters } from './components/CalendarFilters';
import { CalendarMonth } from './components/CalendarMonth';
import { SelectedDayStays } from './components/SelectedDayStays';
import {
  getMonthDays,
  getMonthRange,
  readCalendarFilters,
  shiftCalendarMonth,
} from './model/calendar-model';
import { useAdminCalendar } from './hooks/use-admin-calendar';
import { StayViewNavigation } from '../stays/components/StayViewNavigation';
import { getScheduleViewSearch } from '../stays/model/stay-navigation';
import { AdminScheduleListScreen } from '../schedule/AdminScheduleListScreen';
import './styles/calendar.css';

export function AdminCalendarScreen() {
  const { state, rejectSession } = useAdminSession();
  const [search] = useSearchParams();
  const view = search.get('view') === 'schedule-list' ? 'list' : 'calendar';
  useEffect(() => {
    document.getElementById('main-content')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, left: 0 });
  }, [view]);
  if (state.status !== 'authenticated') return null;
  if (view === 'list') return <AdminScheduleListScreen />;
  return (
    <CalendarWorkspace token={state.token} rejectSession={rejectSession} />
  );
}

function CalendarWorkspace({
  token,
  rejectSession,
}: {
  token: string;
  rejectSession: (token: string) => void;
}) {
  const [initialDate] = useState(getSeoulToday);
  const [search, setSearch] = useSearchParams();
  const location = useLocation();
  const { date, propertyId, error } = readCalendarFilters(search, initialDate);
  const month = date.slice(0, 7);
  const range = getMonthRange(month);
  const calendar = useAdminCalendar(
    { ...range, propertyId },
    !error,
    token,
    rejectSession,
  );
  const properties = useAdminPropertyOptions(token, rejectSession);
  const data =
    calendar.resource.status === 'ready' ? calendar.resource.data : undefined;
  const days = data ? getMonthDays(month, data.items) : [];
  const selectedDay = days.find((day) => day.date === date);
  const options =
    properties.resource.status === 'ready' ? properties.resource.data : [];
  const selectedProperty = options.find(
    (property) => property.id === propertyId,
  );
  const previous = shiftCalendarMonth(date, -1);
  const next = shiftCalendarMonth(date, 1);
  const viewContext = getScheduleViewSearch(search, initialDate);
  const returnQuery = new URLSearchParams(viewContext.calendarSearch);
  const notice: unknown = location.state;
  const saved =
    typeof notice === 'object' && notice !== null && 'stayNotice' in notice
      ? notice.stayNotice
      : undefined;

  function select(selected: string, id = propertyId) {
    const query = new URLSearchParams(returnQuery);
    query.set('date', selected);
    if (id) query.set('propertyId', id);
    else query.delete('propertyId');
    if (selected.slice(0, 7) !== month) {
      const nextRange = getMonthRange(selected.slice(0, 7));
      query.set('from', nextRange.from);
      query.set('to', nextRange.to);
      query.delete('page');
    }
    if (id !== propertyId) query.delete('page');
    setSearch(query);
  }

  function inspectSelected() {
    const heading = document.getElementById('calendar-selected-title');
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ block: 'start', behavior: 'auto' });
  }

  function reset() {
    const today = getSeoulToday();
    setSearch({ view: 'calendar', date: today });
    return today;
  }

  function showToday() {
    const today = getSeoulToday();
    select(today);
    // Selecting another day in the same month reuses the loaded month. Today
    // explicitly refreshes that month so current checklist evidence is fetched.
    if (today.slice(0, 7) === month) calendar.refresh();
  }

  return (
    <div className="admin-calendar">
      <header className="calendar-heading">
        <div>
          <h1>이용 달력</h1>
        </div>
        <div className="calendar-heading__actions">
          <Link
            className="ui-button admin-button-secondary"
            to={appRoutes.adminStayImportCreate}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 16V4m-4 4 4-4 4 4M4 14v6h16v-6" />
            </svg>
            엑셀 가져오기
          </Link>
          <Link
            className="ui-button"
            to={`${appRoutes.adminStayCreate}?${returnQuery}`}
          >
            <span aria-hidden="true">＋</span>
            일정 등록
          </Link>
        </div>
      </header>
      <StayViewNavigation
        view="calendar"
        calendarHref={`${appRoutes.adminCalendar}?${returnQuery}`}
        listHref={appRoutes.adminCalendar + viewContext.listSearch}
        recordsHref={
          appRoutes.adminStays +
          (propertyId ? `?${new URLSearchParams({ propertyId })}` : '')
        }
      />
      {(saved === 'created' || saved === 'updated') && (
        <p className="calendar-success" role="status">
          {saved === 'created'
            ? '새 이용 일정이 등록되었습니다.'
            : '이용 일정이 수정되었습니다.'}
        </p>
      )}
      <p
        className="calendar-announcement"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {!error &&
          (data
            ? `${date}, ${selectedProperty?.name ?? (propertyId ? '선택한 휴양소' : '전체 휴양소')}, 이용 일정 ${selectedDay?.stays.length ?? 0}건`
            : calendar.resource.status === 'loading'
              ? '이용 일정을 불러오고 있습니다.'
              : '')}
      </p>
      <section className="calendar-main" aria-label="달력 조회">
        <div className="calendar-filters">
          <CalendarFilters
            key={returnQuery.toString()}
            date={date}
            propertyId={propertyId}
            properties={
              properties.resource.status === 'ready' ? options : undefined
            }
            propertiesLoading={properties.resource.status === 'loading'}
            propertyError={properties.resource.status === 'error'}
            onApply={select}
            onReset={reset}
          />
          {properties.resource.status === 'error' && (
            <div
              className="calendar-error"
              id="calendar-property-error"
              role="alert"
            >
              <p>
                휴양소 목록을 불러오지 못했습니다. {properties.resource.message}
              </p>
              <button type="button" onClick={properties.refresh}>
                목록 다시 불러오기
              </button>
            </div>
          )}
        </div>
        {error ? (
          <div className="calendar-state" role="alert">
            <h2>조회 조건을 확인해 주세요</h2>
            <p>{error}</p>
            <Button
              type="reset"
              form="calendar-filters"
              className="admin-button-secondary"
            >
              조회 조건 초기화
            </Button>
          </div>
        ) : (
          <>
            {calendar.resource.status === 'error' && (
              <div className="calendar-error" role="alert">
                <p>{calendar.resource.message}</p>
                <button type="button" onClick={calendar.refresh}>
                  일정 다시 불러오기
                </button>
              </div>
            )}
            <CalendarMonth
              month={month}
              days={days}
              selectedDate={date}
              today={data?.today ?? getSeoulToday()}
              state={calendar.resource.status}
              onSelect={(selected) => select(selected)}
              onPrevious={() => {
                if (previous) select(previous);
              }}
              onNext={() => {
                if (next) select(next);
              }}
              onToday={showToday}
              onInspectSelected={inspectSelected}
              canPrevious={previous !== null}
              canNext={next !== null}
            />
            <div className="calendar-meta">
              <p>
                {data
                  ? `이 달의 일정 ${data.total.toLocaleString('ko-KR')}건`
                  : calendar.resource.status === 'loading'
                    ? '일정을 불러오고 있습니다…'
                    : '일정을 다시 불러와 주세요.'}
                {data && (
                  <time dateTime={data.asOf}>
                    최근 조회 {formatSeoulUpdatedAt(data.asOf)}
                  </time>
                )}
              </p>
              <Button
                className="calendar-refresh"
                onClick={calendar.refresh}
                disabled={calendar.resource.status === 'loading'}
                aria-label="이용 달력 새로고침"
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 3M4 15l2 3a7 7 0 0 0 12-1" />
                </svg>
                새로고침
              </Button>
            </div>
          </>
        )}
      </section>
      {!error && data && (
        <SelectedDayStays
          date={date}
          stays={selectedDay?.stays ?? []}
          returnSearch={`?${returnQuery}`}
        />
      )}
      <details className="calendar-footnote">
        <summary>일정 표시 안내</summary>
        <p>
          취소되지 않은 예정 일정이며 비활성 휴양소도 포함됩니다. 체크리스트
          제출은 실제 입·퇴실이나 정비 완료를 뜻하지 않습니다. 과거 날짜도
          현재 제출 내역을 반영합니다.
        </p>
      </details>
    </div>
  );
}
