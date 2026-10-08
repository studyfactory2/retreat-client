import { useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { isPropertyId } from '../../../features/admin-properties/admin-property-management-validation';
import type { GetAdminPropertiesInput } from '../../../features/admin-properties/admin-property-management.types';
import { Button } from '../../../shared/ui/Button/Button';
import { AdminListHeader } from '../components/AdminListHeader';
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
    setSearch(propertyListSearch(next));
  }

  return (
    <div className="admin-directory admin-property-directory">
      <AdminListHeader
        title="휴양소 관리"
        description="휴양소 정보와 담당 직원을 확인하세요."
        createLabel="휴양소 등록"
        createHref={appRoutes.adminPropertyCreate + returnSearch}
      />
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
      <div className="admin-directory-summary">
        <p role="status">
          {data && correctedPage === null ? (
            <>
              {filtered ? '검색 결과' : '등록된 휴양소'}{' '}
              <strong>{data.total.toLocaleString('ko-KR')}곳</strong>
            </>
          ) : resource.status === 'error' ? (
            '목록을 다시 확인해 주세요.'
          ) : (
            '목록을 불러오고 있습니다…'
          )}
        </p>
        <Button
          className="admin-directory-refresh"
          onClick={refresh}
          disabled={resource.status === 'loading' || correctedPage !== null}
        >
          새로고침
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
            <section className="admin-directory-table" aria-label="휴양소 목록">
              <div className="admin-directory-table-head" aria-hidden="true">
                <span>휴양소</span>
                <div className="admin-directory-fields">
                  <span>지역</span>
                  <span>담당 직원</span>
                </div>
                <span>상태</span>
                <span>관리</span>
              </div>
              <ul className="admin-directory-rows" role="list">
                {resource.data.items.map((property) => (
                  <li key={property.id}>
                    <PropertyCard
                      property={property}
                      detailHref={`${appRoutes.adminProperties}/${property.id}${returnSearch}`}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
          <p className="admin-directory-footnote">
            활성 휴양소는 새 이용 일정을 등록할 수 있습니다.
          </p>
          <AdminListPagination
            label="휴양소 목록 페이지"
            page={filters.page}
            totalPages={resource.data.totalPages}
            onPage={(page) => select({ ...filters, page })}
          />
        </>
      )}
    </div>
  );
}
