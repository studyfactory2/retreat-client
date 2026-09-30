import { Link, useParams, useSearchParams } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { Button } from '../../../shared/ui/Button/Button';
import { PageState } from '../../../shared/ui/PageState/PageState';
import { StaffEditor } from './components/StaffEditor';
import { useAdminStaffDetail } from './hooks/use-admin-staff';
import { readStaffFilters, staffListSearch } from './model/staff-list-model';
import './styles/staff.css';

export function AdminStaffEditorScreen({
  creating = false,
}: {
  creating?: boolean;
}) {
  const { state, rejectSession } = useAdminSession();
  const { id = '' } = useParams();
  const [search] = useSearchParams();
  if (state.status !== 'authenticated') return null;
  const returnUrl =
    appRoutes.adminStaff + staffListSearch(readStaffFilters(search));
  const key = `${id}:${state.user.id}:${state.expiresAt}`;
  return (
    <div className="admin-staff">
      {creating ? (
        <StaffEditor
          key={key}
          token={state.token}
          rejectSession={rejectSession}
          returnUrl={returnUrl}
        />
      ) : (
        <StaffDetailWorkspace
          key={key}
          id={id}
          token={state.token}
          rejectSession={rejectSession}
          returnUrl={returnUrl}
        />
      )}
    </div>
  );
}

function StaffDetailWorkspace({
  id,
  token,
  rejectSession,
  returnUrl,
}: {
  id: string;
  token: string;
  rejectSession: (token: string) => void;
  returnUrl: string;
}) {
  const { resource, refresh } = useAdminStaffDetail(id, token, rejectSession);
  if (resource.status !== 'ready')
    return (
      <div role={resource.status === 'error' ? 'alert' : 'status'}>
        <PageState
          title={
            resource.status === 'loading'
              ? '직원 정보를 불러오는 중'
              : '직원 정보를 불러오지 못했습니다'
          }
          description={
            resource.status === 'error'
              ? resource.message
              : '잠시만 기다려 주세요.'
          }
        >
          {resource.status === 'error' && (
            <Button onClick={refresh}>다시 불러오기</Button>
          )}
          <Link className="ui-button admin-button-secondary" to={returnUrl}>
            목록으로 돌아가기
          </Link>
        </PageState>
      </div>
    );
  return (
    <StaffEditor
      key={resource.data.updatedAt}
      original={resource.data}
      token={token}
      rejectSession={rejectSession}
      returnUrl={returnUrl}
      onReload={refresh}
    />
  );
}
