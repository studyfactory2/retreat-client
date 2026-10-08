import { useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { isStaffId } from '../../../features/admin-staff/admin-staff-validation';
import { Button } from '../../../shared/ui/Button/Button';
import { AdminListHeader } from '../components/AdminListHeader';
import { AdminListPagination } from '../components/AdminListPagination';
import { AdminListState } from '../components/AdminListState';
import { StaffCard } from './components/StaffCard';
import { StaffFilters } from './components/StaffFilters';
import { useAdminStaffList } from './hooks/use-admin-staff';
import { readStaffFilters, staffListSearch } from './model/staff-list-model';
import '../styles/admin-directory.css';

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
      <AdminListHeader
        title="직원 관리"
        description="직원 정보와 담당 휴양소를 확인하세요."
        createLabel="직원 등록"
        createHref={appRoutes.adminStaffCreate + returnSearch}
      />
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
        onApply={(next) => setSearch(staffListSearch(next))}
      />
      <div className="admin-directory-summary">
        <p role="status">
          {data && correctedPage === null ? (
            <>
              {filtered ? '검색 결과' : '등록된 직원'}{' '}
              <strong>{data.total.toLocaleString('ko-KR')}명</strong>
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
            <section className="admin-directory-table" aria-label="직원 목록">
              <div className="admin-directory-table-head" aria-hidden="true">
                <span>이름 · 소속</span>
                <div className="admin-directory-fields">
                  <span>연락처</span>
                  <span>담당 휴양소</span>
                </div>
                <span>상태</span>
                <span>관리</span>
              </div>
              <ul className="admin-directory-rows" role="list">
                {resource.data.items.map((staff) => (
                  <li key={staff.id}>
                    <StaffCard
                      staff={staff}
                      href={`${appRoutes.adminStaff}/${staff.id}${returnSearch}`}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
          <p className="admin-directory-footnote">
            담당 휴양소 수에는 비활성 휴양소도 포함됩니다.
          </p>
          <AdminListPagination
            label="직원 목록 페이지"
            page={filters.page}
            totalPages={resource.data.totalPages}
            onPage={(page) => setSearch(staffListSearch({ ...filters, page }))}
          />
        </>
      )}
    </div>
  );
}
