import { useSearchParams } from 'react-router-dom';
import { useAdminSession } from '../../../core/session/use-admin-session';
import {
  formatSeoulUpdatedAt,
  getSeoulToday,
} from '../../../core/dates/seoul-date';
import { useAdminPropertyOptions } from '../../../features/admin-properties/use-admin-property-options';
import { Button } from '../../../shared/ui/Button/Button';
import { PageState } from '../../../shared/ui/PageState/PageState';
import { DashboardFilters } from './DashboardFilters';
import { DashboardOverview } from './DashboardOverview';
import { readDashboardFilters } from './dashboard-filters';
import { useAdminDashboard } from './use-admin-dashboard';
import './dashboard.css';

export function AdminDashboardScreen() {
  const { state, rejectSession } = useAdminSession();
  if (state.status !== 'authenticated') return null;
  return (
    <DashboardWorkspace token={state.token} rejectSession={rejectSession} />
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
  const propertyOptions =
    properties.resource.status === 'ready' ? properties.resource.data : [];
  const propertyName = input.propertyId
    ? (propertyOptions.find((property) => property.id === input.propertyId)
        ?.name ?? '선택한 휴양소')
    : '전체 휴양소';

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
        <div>
          <p className="dashboard-heading__eyebrow">OPERATIONS OVERVIEW</p>
          <h1>운영 현황</h1>
          <p className="dashboard-heading__description">
            날짜별 이용 현황과 현재 확인할 업무를 한눈에 살펴보세요.
          </p>
        </div>
        <Button
          className="admin-button-secondary"
          onClick={dashboard.refresh}
          disabled={!!filterError || dashboard.resource.status === 'loading'}
        >
          새로고침
        </Button>
      </header>

      <section className="dashboard-query" aria-label="조회 조건">
        <DashboardFilters
          key={`${search.toString()}:${selectedDate}`}
          date={selectedDate}
          propertyId={input.propertyId ?? ''}
          properties={propertyOptions}
          propertiesLoading={properties.resource.status === 'loading'}
          propertiesError={properties.resource.status === 'error'}
          onApply={applyFilters}
          onToday={(propertyId) => applyFilters('', propertyId)}
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
        <p className="dashboard-query__hint">
          한국 시간 기준 · 전체 휴양소에는 비활성 휴양소도 포함됩니다.
        </p>
      </section>

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
          <PageState
            title="조회 조건을 확인해 주세요"
            description={filterError}
          >
            <Button onClick={() => setSearch({})}>조회 조건 초기화</Button>
          </PageState>
        </div>
      ) : (
        <section
          className="dashboard-results"
          aria-label="운영 현황 결과"
          aria-busy={dashboard.resource.status === 'loading'}
        >
          <div className="dashboard-results__meta">
            <p>
              <strong>{propertyName}</strong>
              <span>{selectedDate.replaceAll('-', '.')}</span>
            </p>
            {data && (
              <p>
                최근 조회{' '}
                <time dateTime={data.asOf}>
                  {formatSeoulUpdatedAt(data.asOf)}
                </time>
              </p>
            )}
          </div>
          {dashboard.resource.status === 'loading' && (
            <div
              className="dashboard-state dashboard-state--loading"
              role="status"
            >
              <span className="dashboard-state__spinner" aria-hidden="true" />
              <h2>운영 현황을 불러오고 있습니다</h2>
              <p>선택한 조건의 기록을 확인하고 있습니다.</p>
            </div>
          )}
          {dashboard.resource.status === 'error' && (
            <div className="dashboard-state" role="alert">
              <PageState
                title="운영 현황을 불러오지 못했습니다"
                description={dashboard.resource.message}
              >
                <Button onClick={dashboard.refresh}>다시 불러오기</Button>
              </PageState>
            </div>
          )}
          {data && <DashboardOverview data={data} />}
        </section>
      )}
    </div>
  );
}
