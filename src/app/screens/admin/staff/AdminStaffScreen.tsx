import { useEffect, useLayoutEffect, useRef } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { isStaffId } from '../../../features/admin-staff/admin-staff-validation';
import { Button } from '../../../shared/ui/Button/Button';
import { AdminListPagination } from '../components/AdminListPagination';
import { AdminListState } from '../components/AdminListState';
import { StaffCard } from './components/StaffCard';
import { StaffFilters } from './components/StaffFilters';
import { useAdminStaffList } from './hooks/use-admin-staff';
import { readStaffFilters, staffListSearch } from './model/staff-list-model';
import '../styles/admin-directory.css';
import './styles/staff-directory.css';

export function AdminStaffScreen() {
  const { state, rejectSession } = useAdminSession();
  if (state.status !== 'authenticated') return null;
  return (
    <StaffWorkspace
      key={`${state.user.id}:${state.expiresAt}`}
      token={state.token}
      rejectSession={rejectSession}
    />
  );
}

function StaffWorkspace({
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
  const filters = readStaffFilters(search);
  const returnSearch = staffListSearch(filters);
  const { resource, refresh } = useAdminStaffList(
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
    'staffNotice' in notice &&
    (notice.staffNotice === 'created' || notice.staffNotice === 'updated') &&
    'staffName' in notice &&
    typeof notice.staffName === 'string' &&
    'staffId' in notice &&
    isStaffId(notice.staffId)
      ? {
          id: notice.staffId,
          name: notice.staffName,
          created: notice.staffNotice === 'created',
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
    if (correctedPage === null) return;
    const next = new URLSearchParams(returnSearch);
    if (correctedPage === 1) next.delete('page');
    else next.set('page', String(correctedPage));
    setSearch(next, { replace: true });
  }, [correctedPage, returnSearch, setSearch]);
  return (
    <div className="admin-directory admin-staff-directory">
      <header className="staff-directory-heading">
        <h1>직원 관리</h1>
        <Link className="ui-button" to={appRoutes.adminStaffCreate + returnSearch}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          직원 등록
        </Link>
      </header>
      {saved && (
        <div className="admin-directory-notice" role="status">
          <p>
            <strong>{saved.name}</strong> 님의 정보가{' '}
            {saved.created ? '등록' : '수정'}되었습니다.
          </p>
          <Link to={`${appRoutes.adminStaff}/${saved.id}${returnSearch}`}>
            저장된 정보 확인 →
          </Link>
        </div>
      )}
      <StaffFilters
        key={returnSearch}
        input={filters}
        onApply={(next) => {
          const nextSearch = staffListSearch(next);
          const active = document.activeElement;
          filterFocus.current =
            nextSearch !== returnSearch &&
            active instanceof HTMLElement &&
            active.closest('#staff-filters')
              ? {
                  element: active,
                  id: active.id || 'staff-search',
                  query: nextSearch,
                }
              : null;
          setSearch(nextSearch);
        }}
      />
      <section className="staff-directory-panel" aria-labelledby="staff-results-title">
        <div className="staff-directory-summary">
          <h2 id="staff-results-title" aria-live="polite">
            {data && correctedPage === null ? (
              <>
                {filtered ? '검색 결과' : '직원'}{' '}
                <strong>{data.total.toLocaleString('ko-KR')}명</strong>
              </>
            ) : resource.status === 'error' ? (
              '목록을 다시 확인해 주세요.'
            ) : (
              '목록을 불러오고 있습니다…'
            )}
          </h2>
          <Button
            className="admin-directory-refresh staff-directory-refresh"
            onClick={refresh}
            disabled={resource.status === 'loading' || correctedPage !== null}
            aria-label="직원 목록 새로고침"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6.1 7a7 7 0 0 1 11.55-2L20 8M4 16l2.35 3A7 7 0 0 0 17.9 17" /></svg>
          </Button>
        </div>
        {resource.status === 'loading' || correctedPage !== null ? (
          <AdminListState
            title="직원을 불러오는 중"
            description="잠시만 기다려 주세요."
            loading
          />
        ) : resource.status === 'error' ? (
          <AdminListState
            title="직원 목록을 불러오지 못했습니다"
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
                    ? '조건에 맞는 직원이 없습니다'
                    : '등록된 직원이 없습니다'
                }
                description={
                  filtered
                    ? '검색어나 활성 상태를 변경해 주세요.'
                    : '상단의 직원 등록에서 이름과 연락처를 등록해 주세요.'
                }
              >
                {filtered && (
                  <Button
                    className="admin-button-secondary"
                    onClick={() => setSearch('')}
                  >
                    조회 조건 초기화
                  </Button>
                )}
              </AdminListState>
            ) : (
              <div className="staff-directory-table">
                <div className="staff-directory-table-head" aria-hidden="true">
                  <span>직원</span>
                  <div className="staff-directory-facts">
                    <span>연락처</span>
                    <span>담당 휴양소</span>
                  </div>
                  <span>상태</span>
                  <span />
                </div>
                <ul className="staff-directory-rows" role="list" aria-label="직원 목록">
                  {resource.data.items.map((staff) => (
                    <li key={staff.id}>
                      <StaffCard
                        staff={staff}
                        href={`${appRoutes.adminStaff}/${staff.id}${returnSearch}`}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <AdminListPagination
              label="직원 목록 페이지"
              page={filters.page}
              totalPages={resource.data.totalPages}
              onPage={(page) => setSearch(staffListSearch({ ...filters, page }))}
            />
          </>
        )}
      </section>
      <p className="staff-directory-note">담당 휴양소에는 비활성 휴양소도 포함됩니다.</p>
    </div>
  );
}
