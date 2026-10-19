import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { useAdminPropertyOptions } from '../../../features/admin-properties/use-admin-property-options';
import type { AdminMaintenanceInput } from '../../../features/admin-maintenance/admin-maintenance.types';
import { Button } from '../../../shared/ui/Button/Button';
import { AdminListState } from '../components/AdminListState';
import { AdminAppliedFilters } from '../components/AdminAppliedFilters';
import { maintenanceAppliedFilters } from './model/maintenance-applied-filters';
import { MaintenanceFilters } from './components/MaintenanceFilters';
import { MaintenanceRows } from './components/MaintenanceRows';
import { MaintenanceRecordGuide } from './components/MaintenanceRecordGuide';
import { useAdminMaintenance } from './hooks/use-admin-maintenance';
import {
  maintenanceFilterErrors,
  maintenanceSearch,
  readMaintenanceFilters,
} from './model/maintenance-filters';
import { maintenanceTime } from './model/maintenance-presentation';
import '../styles/admin-directory.css';
import './styles/maintenance.css';
import './styles/maintenance-records.css';

export function AdminMaintenanceScreen() {
  const { state, rejectSession } = useAdminSession();
  if (state.status !== 'authenticated') return null;
  return (
    <MaintenanceWorkspace
      key={`${state.user.id}:${state.expiresAt}`}
      token={state.token}
      rejectSession={rejectSession}
    />
  );
}
function MaintenanceWorkspace({
  token,
  rejectSession,
}: {
  token: string;
  rejectSession: (token: string) => void;
}) {
  const [search, setSearch] = useSearchParams();
  const [filterReset, setFilterReset] = useState(0);
  const filterFocus = useRef<{ element: HTMLElement; target: string; query: string } | null>(null);
  const filters = readMaintenanceFilters(search);
  const query = maintenanceSearch(filters);
  const invalid = Object.keys(maintenanceFilterErrors(filters)).length > 0;
  const { resource, refresh } = useAdminMaintenance(
    filters,
    token,
    rejectSession,
    !invalid,
  );
  const properties = useAdminPropertyOptions(token, rejectSession);
  const appliedFilters = maintenanceAppliedFilters(
    filters,
    properties.resource.status === 'ready' ? properties.resource.data : undefined,
  );
  const correctedPage =
    resource.status === 'ready' &&
    filters.page > Math.max(1, resource.data.totalPages)
      ? Math.max(1, resource.data.totalPages)
      : null;
  useEffect(() => {
    if (correctedPage !== null)
      setSearch(
        maintenanceSearch({
          ...readMaintenanceFilters(new URLSearchParams(query)),
          page: correctedPage,
        }),
        { replace: true },
      );
  }, [correctedPage, query, setSearch]);
  useLayoutEffect(() => {
    const previous = filterFocus.current;
    // Reset state and URL navigation may commit separately. Restore focus after both.
    if (!previous || previous.query !== query) return;
    filterFocus.current = null;
    if (!previous.element.isConnected && document.activeElement === document.body) {
      document.getElementById(previous.target)?.focus({ preventScroll: true });
    }
  }, [filterReset, query]);
  function rememberFilterFocus(nextQuery: string) {
    filterFocus.current = null;
    const active = document.activeElement;
    if (active instanceof HTMLElement && active.closest('#maintenance-filters')) {
      filterFocus.current = {
        element: active,
        query: nextQuery,
        target: active.closest('.admin-property-select')
          ? 'maintenance-property'
          : active.closest('.maintenance-period__body')
            ? 'maintenance-period-toggle'
            : active.id || 'maintenance-period-toggle',
      };
    } else if (active instanceof HTMLButtonElement && active.form?.id === 'maintenance-filters') {
      filterFocus.current = { element: active, target: 'maintenance-period-toggle', query: nextQuery };
    }
  }
  function apply(next: AdminMaintenanceInput) {
    const nextQuery = maintenanceSearch(next);
    rememberFilterFocus(nextQuery);
    setSearch(nextQuery);
  }
  function reset() {
    rememberFilterFocus('');
    setFilterReset((value) => value + 1);
    setSearch(maintenanceSearch({ page: 1, dateField: 'STARTED', view: 'ALL' }));
  }
  const busy = !invalid && (resource.status === 'loading' || correctedPage !== null);
  return (
    <div className="admin-directory admin-maintenance">
      <header className="maintenance-heading">
        <h1>청소·정비</h1>
      </header>
      <MaintenanceFilters
        key={`${query}:${filterReset}`}
        input={filters}
        properties={properties.resource.status === 'ready' ? properties.resource.data : undefined}
        propertiesLoading={properties.resource.status === 'loading'}
        propertyError={properties.resource.status === 'error'}
        onApply={apply}
        onReset={reset}
        count={!invalid && !busy && resource.status === 'ready' ? resource.data.total : undefined}
        busy={busy}
        onRefresh={() => { refresh(); properties.refresh(); }}
      />
      {properties.resource.status === 'error' && (
        <div id="maintenance-property-error" className="maintenance-banner" role="alert">
          <p>휴양소 목록을 불러오지 못했습니다. {properties.resource.message}</p>
          <Button className="admin-button-secondary" onClick={properties.refresh}>
            다시 불러오기
          </Button>
        </div>
      )}
      <section className="maintenance-panel" aria-labelledby="maintenance-results-title">
        <h2 id="maintenance-results-title" className="maintenance-sr-only">청소·정비 기록</h2>
        {invalid ? (
          <AdminListState
            title="조회 조건을 확인해 주세요"
            description="표시된 조건을 수정한 뒤 조회해 주세요."
            error
          >
            <Button type="reset" form="maintenance-filters" className="admin-button-secondary">
              조회 조건 초기화
            </Button>
          </AdminListState>
        ) : busy ? (
          <AdminListState
            title="청소·정비 기록을 불러오는 중"
            description="조회 조건에 맞는 기록을 확인하고 있습니다."
            loading
          />
        ) : resource.status === 'error' ? (
          <AdminListState
            title="청소·정비 기록을 불러오지 못했습니다"
            description={resource.message}
            error
          >
            <Button onClick={refresh}>다시 불러오기</Button>
          </AdminListState>
        ) : resource.status === 'ready' ? (
          <>
            {resource.data.items.length === 0 ? (
              <AdminListState
                title="조건에 맞는 정비 기록이 없습니다"
                description="다른 휴양소나 기간을 선택해 주세요."
              >
                <Button type="reset" form="maintenance-filters" className="admin-button-secondary">
                  조회 조건 초기화
                </Button>
              </AdminListState>
            ) : (
              <MaintenanceRows items={resource.data.items} filters={filters} />
            )}
            {resource.data.totalPages > 1 && (
              <nav className="maintenance-pagination" aria-label="청소·정비 목록 페이지">
                <Button
                  className="admin-button-secondary"
                  disabled={filters.page <= 1}
                  onClick={() => apply({ ...filters, page: filters.page - 1 })}
                >이전</Button>
                <span aria-current="page">{filters.page} / {resource.data.totalPages} 페이지</span>
                <Button
                  className="admin-button-secondary"
                  disabled={filters.page >= resource.data.totalPages}
                  onClick={() => apply({ ...filters, page: filters.page + 1 })}
                >다음</Button>
              </nav>
            )}
          </>
        ) : null}
      </section>
      <MaintenanceRecordGuide>
        {!invalid && <AdminAppliedFilters items={appliedFilters} />}
        {!invalid && !busy && resource.status === 'ready' && (
          <p>상태 기준 · {maintenanceTime(resource.data.asOf)} · 한국 시간</p>
        )}
      </MaintenanceRecordGuide>
    </div>
  );
}
