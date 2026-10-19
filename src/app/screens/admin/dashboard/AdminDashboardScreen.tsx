import { Link, useSearchParams } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';
import { useAdminSession } from '../../../core/session/use-admin-session';
import {
  formatSeoulUpdatedAt,
  getSeoulToday,
} from '../../../core/dates/seoul-date';
import { useAdminPropertyOptions } from '../../../features/admin-properties/use-admin-property-options';
import { Button } from '../../../shared/ui/Button/Button';
import { appliedPropertyLabel } from '../model/applied-filter-summary';
import { DashboardFilters } from './components/DashboardFilters';
import { DashboardOverview } from './components/DashboardOverview';
import { DashboardActivity } from './components/DashboardActivity';
import { dashboardLinks } from './model/dashboard-links';
import { readDashboardFilters } from './model/dashboard-filters';
import { useAdminDashboard } from './hooks/use-admin-dashboard';
import './styles/dashboard.css';

const dashboardDateFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
});

export function AdminDashboardScreen() {
  const { state, rejectSession } = useAdminSession();
  if (state.status !== 'authenticated') return null;
  return (
    <DashboardWorkspace
      key={`${state.user.id}:${state.expiresAt}`}
      token={state.token}
      rejectSession={rejectSession}
    />
  );
}

function DashboardWorkspace({
  token,
  rejectSession,
}: {
  token: string;
  rejectSession: (token: string) => void;
}) {
  const [search, setSearch] = useSearchParams();
  const { input, error: filterError } = readDashboardFilters(search);
  const dashboard = useAdminDashboard(
    input,
    !filterError,
    token,
    rejectSession,
  );
  const properties = useAdminPropertyOptions(token, rejectSession);
  const data =
    dashboard.resource.status === 'ready' ? dashboard.resource.data : undefined;
  const selectedDate = input.date ?? data?.date ?? getSeoulToday();
  const links = dashboardLinks(selectedDate, input.propertyId);
  const propertyOptions =
    properties.resource.status === 'ready' ? properties.resource.data : [];
  const propertyName = appliedPropertyLabel(input.propertyId, propertyOptions);

  function applyFilters(date: string, propertyId: string) {
    const next = new URLSearchParams();
    if (date) next.set('date', date);
    if (propertyId) next.set('propertyId', propertyId);
    if (next.toString() === search.toString()) dashboard.refresh();
    else setSearch(next);
  }

  return (
    <div className="admin-dashboard">
      <header className="dashboard-heading">
        <h1>운영 현황</h1>
        <div className="dashboard-heading__actions">
          <Link className="ui-button" to={appRoutes.adminStayCreate}>
            <span aria-hidden="true">＋</span> 일정 등록
          </Link>
        </div>
      </header>

      <div className="dashboard-welcome">
        <time className="dashboard-heading__date" dateTime={selectedDate}>
          {dashboardDateFormatter.format(
            new Date(`${selectedDate}T00:00:00Z`),
          )}
        </time>
        <div className="dashboard-welcome__updated">
          {data && (
            <span>
              최근 조회{' '}
              <time dateTime={data.asOf}>
                {formatSeoulUpdatedAt(data.asOf)}
              </time>
            </span>
          )}
          <Button
            className="dashboard-refresh admin-button-secondary"
            onClick={dashboard.refresh}
            disabled={
              !!filterError || dashboard.resource.status === 'loading'
            }
            aria-label="운영 현황 새로고침"
            title="새로고침"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M20 7v5h-5M4 17v-5h5M6.1 7a7 7 0 0 1 11.6-1L20 9M4 15l2.3 3A7 7 0 0 0 17.9 17" />
            </svg>
          </Button>
        </div>
      </div>

      <details
        className="dashboard-query"
        open={
          !!filterError || properties.resource.status === 'error' || undefined
        }
      >
        <summary>
          <span className="dashboard-query__label">조회 조건</span>
          <span className="dashboard-query__scope">{propertyName}</span>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        <div className="dashboard-query__body">
          <DashboardFilters
            key={`${search.toString()}:${selectedDate}`}
            date={selectedDate}
            propertyId={input.propertyId ?? ''}
            properties={propertyOptions}
            propertiesLoading={properties.resource.status === 'loading'}
            propertiesError={properties.resource.status === 'error'}
            onApply={applyFilters}
            onToday={(propertyId) => applyFilters('', propertyId)}
            onReset={() => setSearch({})}
          />
          {properties.resource.status === 'error' && (
            <div
              className="dashboard-query__error"
              id="property-load-error"
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
      </details>

      <p
        className="dashboard-announcement"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {!filterError &&
          (data
            ? `${propertyName}, ${data.date} 운영 현황을 불러왔습니다.`
            : dashboard.resource.status === 'loading'
              ? '운영 현황을 불러오고 있습니다.'
              : '')}
      </p>
      {filterError ? (
        <div className="dashboard-state" role="alert">
          <h2>조회 조건을 확인해 주세요</h2>
          <p>{filterError}</p>
          <Button type="reset" form="dashboard-filters">
            조회 조건 초기화
          </Button>
        </div>
      ) : (
        <section
          className="dashboard-results"
          aria-label="운영 현황 결과"
          aria-busy={dashboard.resource.status === 'loading'}
        >
          {dashboard.resource.status === 'loading' && (
            <div
              className="dashboard-state dashboard-state--loading"
              role="status"
            >
              <span className="dashboard-state__spinner" aria-hidden="true" />
              <h2>운영 현황을 불러오고 있습니다</h2>
            </div>
          )}
          {dashboard.resource.status === 'error' && (
            <div className="dashboard-state" role="alert">
              <h2>운영 현황을 불러오지 못했습니다</h2>
              <p>{dashboard.resource.message}</p>
              <Button onClick={dashboard.refresh}>다시 불러오기</Button>
            </div>
          )}
          {data && (
            <DashboardOverview
              data={data}
              calendarLink={links.calendar}
              maintenanceLinks={links.maintenance}
              issueLinks={links.issues}
            >
              <DashboardActivity
                key={data.asOf}
                date={data.date}
                today={data.today}
                propertyId={input.propertyId}
                token={token}
                rejectSession={rejectSession}
              />
            </DashboardOverview>
          )}
        </section>
      )}
    </div>
  );
}
