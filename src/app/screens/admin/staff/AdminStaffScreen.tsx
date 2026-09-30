import { useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { isStaffId } from '../../../features/admin-staff/admin-staff-validation';
import { Button } from '../../../shared/ui/Button/Button';
import { PageState } from '../../../shared/ui/PageState/PageState';
import { StaffCard } from './components/StaffCard';
import { StaffFilters } from './components/StaffFilters';
import { useAdminStaffList } from './hooks/use-admin-staff';
import { readStaffFilters, staffListSearch } from './model/staff-list-model';
import './styles/staff.css';

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
    <div className="admin-staff">
      <header className="staff-heading">
        <div>
          <p className="staff-heading__eyebrow">OUR TEAM</p>
          <h1>직원 관리</h1>
          <p>직원 정보와 휴양소 배정 현황을 한곳에서 확인하세요.</p>
        </div>
        <div className="staff-actions">
          <Link
            className="ui-button"
            to={appRoutes.adminStaffCreate + returnSearch}
          >
            직원 등록
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
        <div className="staff-banner staff-banner--success" role="status">
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
      {resource.status === 'loading' || correctedPage !== null ? (
        <PageState
          title="직원을 불러오는 중"
          description="잠시만 기다려 주세요."
        />
      ) : resource.status === 'error' ? (
        <div role="alert">
          <PageState
            title="직원 목록을 불러오지 못했습니다"
            description={resource.message}
          >
            <Button onClick={refresh}>다시 불러오기</Button>
          </PageState>
        </div>
      ) : (
        <>
          <div className="staff-summary" role="status">
            <p>
              {filtered ? '검색 결과' : '등록된 직원'}{' '}
              <strong>{resource.data.total.toLocaleString('ko-KR')}명</strong>
            </p>
            <p>직원 등록 후 휴양소 설정에서 담당 직원을 배정할 수 있습니다.</p>
          </div>
          {!resource.data.items.length ? (
            <PageState
              title={
                filtered
                  ? '조건에 맞는 직원이 없습니다'
                  : '첫 직원을 등록해 주세요'
              }
              description={
                filtered
                  ? '검색어나 활성 상태를 변경해 다시 확인해 주세요.'
                  : '담당 직원의 이름과 연락처를 등록해 주세요.'
              }
            >
              {filtered ? (
                <Button onClick={() => setSearch('')}>조회 조건 초기화</Button>
              ) : (
                <Link className="ui-button" to={appRoutes.adminStaffCreate}>
                  첫 직원 등록
                </Link>
              )}
            </PageState>
          ) : (
            <div className="staff-grid" aria-label="직원 목록">
              {resource.data.items.map((staff) => (
                <StaffCard
                  key={staff.id}
                  staff={staff}
                  href={`${appRoutes.adminStaff}/${staff.id}${returnSearch}`}
                />
              ))}
            </div>
          )}
          {resource.data.totalPages > 1 && (
            <nav className="staff-pagination" aria-label="직원 목록 페이지">
              <Button
                className="admin-button-secondary"
                disabled={filters.page <= 1}
                onClick={() =>
                  setSearch(
                    staffListSearch({ ...filters, page: filters.page - 1 }),
                  )
                }
              >
                이전
              </Button>
              <span aria-current="page">
                {filters.page} / {resource.data.totalPages} 페이지
              </span>
              <Button
                className="admin-button-secondary"
                disabled={filters.page >= resource.data.totalPages}
                onClick={() =>
                  setSearch(
                    staffListSearch({ ...filters, page: filters.page + 1 }),
                  )
                }
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
