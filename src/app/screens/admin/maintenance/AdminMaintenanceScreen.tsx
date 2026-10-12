import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { useAdminPropertyOptions } from '../../../features/admin-properties/use-admin-property-options';
import type { AdminMaintenanceInput } from '../../../features/admin-maintenance/admin-maintenance.types';
import { Button } from '../../../shared/ui/Button/Button';
import { PageState } from '../../../shared/ui/PageState/PageState';
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
  const resetFocus = useRef<HTMLButtonElement | null>(null);
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
    const previous = resetFocus.current;
    // URL navigation may commit after the local reset counter. Wait for both.
    if (!previous || query !== '') return;
    resetFocus.current = null;
    if (!previous.isConnected && document.activeElement === document.body)
      document
        .getElementById('maintenance-filter-reset')
        ?.focus({ preventScroll: true });
  }, [filterReset, query]);
  function apply(next: AdminMaintenanceInput) {
    setSearch(maintenanceSearch(next));
  }
  function reset() {
    const active = document.activeElement;
    resetFocus.current =
      active instanceof HTMLButtonElement &&
      active.type === 'reset' &&
      active.form?.id === 'maintenance-filters'
        ? active
        : null;
    setFilterReset((value) => value + 1);
    apply({ page: 1, dateField: 'STARTED', view: 'ALL' });
  }
  return (
    <div className="admin-maintenance">
      <header className="maintenance-heading">
        <div>
          <h1>청소·정비</h1>
          <p>직원이 시작한 체크리스트마다 기록이 하나씩 표시됩니다.</p>
        </div>
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
      </header>
      <MaintenanceFilters
        key={`${query}:${filterReset}`}
        input={filters}
        properties={
          properties.resource.status === 'ready'
            ? properties.resource.data
            : undefined
        }
        propertiesLoading={properties.resource.status === 'loading'}
        propertyError={properties.resource.status === 'error'}
        onApply={apply}
        onReset={reset}
      />
      {properties.resource.status === 'error' && (
        <div
          id="maintenance-property-error"
          className="maintenance-banner"
          role="alert"
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
      {!invalid && (
        <AdminAppliedFilters
          items={maintenanceAppliedFilters(
            filters,
            properties.resource.status === 'ready'
              ? properties.resource.data
              : undefined,
          )}
        />
      )}
      <MaintenanceRecordGuide />
      {invalid ? (
        <div role="alert">
          <PageState
            title="조회 조건을 확인해 주세요"
            description="표시된 조건을 수정한 뒤 조회해 주세요."
          >
            <Button
              type="reset"
              form="maintenance-filters"
              className="admin-button-secondary"
            >
              조회 조건 초기화
            </Button>
          </PageState>
        </div>
      ) : resource.status === 'loading' || correctedPage !== null ? (
        <div role="status">
          <PageState
            title="청소·정비 기록을 불러오는 중"
            description="조회 조건에 맞는 기록을 확인하고 있습니다."
          />
        </div>
      ) : resource.status === 'error' ? (
        <div role="alert">
          <PageState
            title="청소·정비 기록을 불러오지 못했습니다"
            description={resource.message}
          >
            <Button onClick={refresh}>다시 불러오기</Button>
          </PageState>
        </div>
      ) : (
        <>
          <div className="maintenance-summary" role="status">
            <p>
              조회 결과{' '}
              <strong>{resource.data.total.toLocaleString('ko-KR')}건</strong>
            </p>
            <span>
              상태 기준 · {maintenanceTime(resource.data.asOf)} · 한국 시간
            </span>
          </div>
          {resource.data.items.length === 0 ? (
            <PageState
              title="조건에 맞는 정비 기록이 없습니다"
              description="다른 휴양소나 기간을 선택하거나 조회 조건을 초기화해 주세요."
            >
              <Button
                type="reset"
                form="maintenance-filters"
                className="admin-button-secondary"
              >
                조회 조건 초기화
              </Button>
            </PageState>
          ) : (
            <MaintenanceRows items={resource.data.items} filters={filters} />
          )}
          {resource.data.totalPages > 1 && (
            <nav
              className="maintenance-pagination"
              aria-label="청소·정비 목록 페이지"
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
