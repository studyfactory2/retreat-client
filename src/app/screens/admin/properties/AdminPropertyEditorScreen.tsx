import { useParams, useSearchParams, Link } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { Button } from '../../../shared/ui/Button/Button';
import { PageState } from '../../../shared/ui/PageState/PageState';
import { PropertyEditor } from './PropertyEditor';
import { propertyListSearch, readPropertyFilters } from './property-list-model';
import { useAdminProperty } from './use-admin-properties';
import './properties.css';

export function AdminPropertyEditorScreen({
  creating = false,
}: {
  creating?: boolean;
}) {
  const { state, rejectSession } = useAdminSession();
  const { id = '' } = useParams();
  const [search] = useSearchParams();
  const returnUrl =
    appRoutes.adminProperties + propertyListSearch(readPropertyFilters(search));
  if (state.status !== 'authenticated') return null;
  const key = `${id}:${state.user.id}:${state.expiresAt}`;
  return (
    <div className="admin-properties">
      {creating ? (
        <PropertyEditor
          key={key}
          token={state.token}
          rejectSession={rejectSession}
          returnUrl={returnUrl}
        />
      ) : (
        <EditWorkspace
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

function EditWorkspace({
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
  const { resource, refresh } = useAdminProperty(id, token, rejectSession);
  if (resource.status !== 'ready')
    return (
      <div role={resource.status === 'error' ? 'alert' : 'status'}>
        <PageState
          title={
            resource.status === 'loading'
              ? '휴양소 정보를 불러오는 중'
              : '휴양소 정보를 불러오지 못했습니다'
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
    <PropertyEditor
      key={resource.data.updatedAt}
      original={resource.data}
      token={token}
      rejectSession={rejectSession}
      returnUrl={returnUrl}
    />
  );
}
