import { useEffect, useLayoutEffect, useRef } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { isPropertyId } from '../../../features/admin-properties/admin-property-management-validation';
import type { GetAdminPropertiesInput } from '../../../features/admin-properties/admin-property-management.types';
import { Button } from '../../../shared/ui/Button/Button';
import { AdminListPagination } from '../components/AdminListPagination';
import { AdminListState } from '../components/AdminListState';
import { PropertyFilters } from './components/PropertyFilters';
import { PropertyCard } from './components/PropertyCard';
import {
  propertyListSearch,
  readPropertyFilters,
} from './model/property-list-model';
import { useAdminProperties } from './hooks/use-admin-properties';
import '../styles/admin-directory.css';
import './styles/properties.css';

export function AdminPropertiesScreen() {
  const { state, rejectSession } = useAdminSession();
  if (state.status !== 'authenticated') return null;
  return (
    <PropertiesWorkspace
      key={`${state.user.id}:${state.expiresAt}`}
      token={state.token}
      rejectSession={rejectSession}
    />
  );
}

function PropertiesWorkspace({
  token,
  rejectSession,
}: {
  token: string;
  rejectSession: (token: string) => void;
}) {
  const [search, setSearch] = useSearchParams();
  const filterFocus = useRef<{
    element: HTMLElement;
    id: string;
    query: string;
  } | null>(null);
  const filters = readPropertyFilters(search);
  const returnSearch = propertyListSearch(filters);
  const { resource, refresh } = useAdminProperties(
    filters,
    token,
    rejectSession,
  );
  const data = resource.status === 'ready' ? resource.data : undefined;
  const correctedPage =
    data && filters.page > Math.max(1, data.totalPages)
      ? Math.max(1, data.totalPages)
      : null;
  const location = useLocation();
  const notice: unknown = location.state;
  const saved =
    typeof notice === 'object' &&
    notice !== null &&
    'propertyNotice' in notice &&
    (notice.propertyNotice === 'created' ||
      notice.propertyNotice === 'updated') &&
    'propertyName' in notice &&
    typeof notice.propertyName === 'string' &&
    'propertyId' in notice &&
    isPropertyId(notice.propertyId)
      ? {
          name: notice.propertyName,
          id: notice.propertyId,
          created: notice.propertyNotice === 'created',
        }
      : null;
  const filtered = !!filters.search || filters.isActive !== undefined;

  useLayoutEffect(() => {
    const previous = filterFocus.current;
    filterFocus.current = null;
    if (
      previous?.query === returnSearch &&
      !previous.element.isConnected &&
      document.activeElement === document.body
    ) {
      document.getElementById(previous.id)?.focus({ preventScroll: true });
    }
  }, [returnSearch]);

  useEffect(() => {
    document.getElementById('main-content')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, left: 0 });
  }, []);
  useEffect(() => {
    if (correctedPage !== null) {
      const next = new URLSearchParams(returnSearch);
      if (correctedPage === 1) next.delete('page');
      else next.set('page', String(correctedPage));
      setSearch(next, { replace: true });
    }
  }, [correctedPage, returnSearch, setSearch]);

  function select(next: GetAdminPropertiesInput) {
    const nextSearch = propertyListSearch(next);
    const active = document.activeElement;
    filterFocus.current =
      nextSearch !== returnSearch &&
      active instanceof HTMLElement &&
      active.closest('#property-filters')
        ? {
            element: active,
            id: active.id || 'properties-search',
            query: nextSearch,
          }
        : null;
    setSearch(nextSearch);
  }

  return (
    <div className="admin-directory admin-property-directory">
      <header className="property-directory-heading">
        <h1>휴양소 관리</h1>
        <Link className="ui-button" to={appRoutes.adminPropertyCreate + returnSearch}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          휴양소 등록
        </Link>
      </header>
      {saved && (
        <div className="admin-directory-notice" role="status">
          <p>
            <strong>{saved.name}</strong> 휴양소가{' '}
            {saved.created ? '등록' : '수정'}되었습니다.
          </p>
          <Link to={`${appRoutes.adminProperties}/${saved.id}${returnSearch}`}>
            저장된 정보 확인 →
          </Link>
        </div>
      )}
      <PropertyFilters key={returnSearch} input={filters} onApply={select} />
      <section className="property-directory-panel" aria-labelledby="property-results-title">
        <div className="property-directory-summary">
          <h2 id="property-results-title" aria-live="polite">
            {data && correctedPage === null ? (
              <>
                {filtered ? '검색 결과' : '휴양소'}{' '}
                <strong>{data.total.toLocaleString('ko-KR')}곳</strong>
              </>
            ) : resource.status === 'error' ? (
              '목록을 다시 확인해 주세요.'
            ) : (
              '목록을 불러오고 있습니다…'
            )}
          </h2>
          <Button
            className="admin-directory-refresh property-directory-refresh"
            aria-label="휴양소 목록 새로고침"
            onClick={refresh}
            disabled={resource.status === 'loading' || correctedPage !== null}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5M6.1 7a7 7 0 0 1 11.6-1.5L20 8M4 16l2.3 2.5A7 7 0 0 0 17.9 17" /></svg>
          </Button>
        </div>
        {resource.status === 'loading' || correctedPage !== null ? (
          <AdminListState
            title="휴양소를 불러오는 중"
            description="잠시만 기다려 주세요."
            loading
          />
        ) : resource.status === 'error' ? (
          <AdminListState
            title="휴양소 목록을 불러오지 못했습니다"
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
                title={
                  filtered
                    ? '조건에 맞는 휴양소가 없습니다'
                    : '등록된 휴양소가 없습니다'
                }
                description={
                  filtered
                    ? '검색어나 운영 상태를 변경해 주세요.'
                    : '상단의 휴양소 등록에서 첫 휴양소를 등록해 주세요.'
                }
              >
                {filtered && (
                  <Button
                    className="admin-button-secondary"
                    onClick={() => select({ page: 1 })}
                  >
                    조회 조건 초기화
                  </Button>
                )}
              </AdminListState>
            ) : (
              <div className="property-directory-table">
                <div className="property-directory-table-head" aria-hidden="true">
                  <span>휴양소</span>
                  <div className="property-directory-facts">
                    <span>지역</span>
                    <span>담당 직원</span>
                  </div>
                  <span>상태</span>
                  <span />
                </div>
                <ul className="property-directory-rows" role="list" aria-label="휴양소 목록">
                  {resource.data.items.map((property) => (
                    <li key={property.id}>
                      <PropertyCard
                        property={property}
                        detailHref={`${appRoutes.adminProperties}/${property.id}${returnSearch}`}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <AdminListPagination
              label="휴양소 목록 페이지"
              page={filters.page}
              totalPages={resource.data.totalPages}
              onPage={(page) => select({ ...filters, page })}
            />
          </>
        )}
      </section>
    </div>
  );
}
