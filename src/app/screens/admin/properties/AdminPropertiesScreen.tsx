import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { isPropertyId } from '../../../features/admin-properties/admin-property-management-validation';
import type { GetAdminPropertiesInput } from '../../../features/admin-properties/admin-property-management.types';
import { Button } from '../../../shared/ui/Button/Button';
import { PageState } from '../../../shared/ui/PageState/PageState';
import { PropertyCard } from './PropertyCard';
import { propertyListSearch, readPropertyFilters } from './property-list-model';
import { useAdminProperties } from './use-admin-properties';
import './properties.css';

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
    <div className="admin-properties">
      <header className="properties-heading">
        <div>
          <p className="properties-heading__eyebrow">OUR RETREATS</p>
          <h1>휴양소 관리</h1>
          <p>휴양소의 기본 정보와 운영 설정을 한곳에서 관리하세요.</p>
        </div>
        <div className="properties-heading__actions">
          <Link
            className="ui-button"
            to={appRoutes.adminPropertyCreate + returnSearch}
          >
            휴양소 등록
          </Link>
          <Button
            className="admin-button-secondary"
            onClick={refresh}
            disabled={resource.status === 'loading'}
          >
            새로고침
          </Button>
        </div>
      </header>
      {saved && (
        <div
          className="properties-banner properties-banner--success"
          role="status"
        >
          <p>
            <strong>{saved.name}</strong> 휴양소가{' '}
            {saved.created ? '등록' : '수정'}되었습니다.
          </p>
          <Link to={`${appRoutes.adminProperties}/${saved.id}`}>
            저장된 정보 확인 →
          </Link>
        </div>
      )}
      <PropertyFilters key={returnSearch} input={filters} onApply={select} />
      {resource.status === 'loading' || correctedPage !== null ? (
        <PageState
          title="휴양소를 불러오는 중"
          description="잠시만 기다려 주세요."
        />
      ) : resource.status === 'error' ? (
        <div role="alert">
          <PageState
            title="휴양소 목록을 불러오지 못했습니다"
            description={resource.message}
          >
            <Button onClick={refresh}>다시 불러오기</Button>
          </PageState>
        </div>
      ) : (
        <>
          <div className="properties-summary" role="status">
            <p>
              {filtered ? '검색 결과' : '등록된 휴양소'}{' '}
              <strong>{resource.data.total.toLocaleString('ko-KR')}곳</strong>
            </p>
            <span>활성 상태는 새 이용 일정 등록 가능 여부를 나타냅니다.</span>
          </div>
          {resource.data.items.length === 0 ? (
            <PageState
              title={
                filtered
                  ? '조건에 맞는 휴양소가 없습니다'
                  : '첫 휴양소를 등록해 주세요'
              }
              description={
                filtered
                  ? '검색어나 운영 상태를 변경해 다시 확인해 주세요.'
                  : '지역별 휴양소를 등록하면 이용 일정과 연결할 수 있습니다.'
              }
            >
              {filtered ? (
                <Button onClick={() => select({ page: 1 })}>
                  조회 조건 초기화
                </Button>
              ) : (
                <Link className="ui-button" to={appRoutes.adminPropertyCreate}>
                  첫 휴양소 등록
                </Link>
              )}
            </PageState>
          ) : (
            <div className="properties-grid" aria-label="휴양소 목록">
              {resource.data.items.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  detailHref={`${appRoutes.adminProperties}/${property.id}${returnSearch}`}
                />
              ))}
            </div>
          )}
          {resource.data.totalPages > 1 && (
            <nav
              className="properties-pagination"
              aria-label="휴양소 목록 페이지"
            >
              <Button
                className="admin-button-secondary"
                disabled={filters.page <= 1}
                onClick={() => select({ ...filters, page: filters.page - 1 })}
              >
                이전
              </Button>
              <span aria-current="page">
                {filters.page} / {resource.data.totalPages} 페이지
              </span>
              <Button
                className="admin-button-secondary"
                disabled={filters.page >= resource.data.totalPages}
                onClick={() => select({ ...filters, page: filters.page + 1 })}
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

function PropertyFilters({
  input,
  onApply,
}: {
  input: GetAdminPropertiesInput;
  onApply: (input: GetAdminPropertiesInput) => void;
}) {
  const [text, setText] = useState(input.search ?? '');
  const [status, setStatus] = useState(
    input.isActive === undefined
      ? 'all'
      : input.isActive
        ? 'active'
        : 'inactive',
  );
  return (
    <form
      className="properties-toolbar"
      aria-label="휴양소 조회 조건"
      onSubmit={(event) => {
        event.preventDefault();
        onApply({
          page: 1,
          search: text.trim() || undefined,
          isActive: status === 'all' ? undefined : status === 'active',
        });
      }}
    >
      <div>
        <label htmlFor="properties-search">휴양소 검색</label>
        <input
          id="properties-search"
          type="search"
          placeholder="휴양소 이름 또는 지역"
          maxLength={100}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </div>
      <div>
        <label htmlFor="properties-status">운영 상태</label>
        <select
          id="properties-status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">전체</option>
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
        </select>
      </div>
      <Button type="submit" className="admin-button-secondary">
        조회
      </Button>
    </form>
  );
}
