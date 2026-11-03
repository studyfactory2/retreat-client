import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { Button } from '../../../shared/ui/Button/Button';
import { PageState } from '../../../shared/ui/PageState/PageState';
import { AccessSettingsEditor } from './components/AccessSettingsEditor';
import { usePropertyAccess } from './hooks/use-property-access';
import './styles/property-access.css';

export function AdminPropertyAccessScreen() {
  const { id = '' } = useParams();
  const { state, rejectSession } = useAdminSession();
  if (state.status !== 'authenticated') return null;
  return (
    <AccessWorkspace
      key={`${id}:${state.user.id}:${state.expiresAt}`}
      propertyId={id}
      token={state.token}
      rejectSession={rejectSession}
    />
  );
}

function AccessWorkspace({
  propertyId,
  token,
  rejectSession,
}: {
  propertyId: string;
  token: string;
  rejectSession: (token: string) => void;
}) {
  const { resource, accept, refresh } = usePropertyAccess(
    propertyId,
    token,
    rejectSession,
  );
  const [saveCount, setSaveCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const notice = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (saved) notice.current?.focus();
  }, [saved, saveCount]);
  return (
    <div className="property-access-workspace">
      {saved && (
        <div
          className="access-notice access-notice--success"
          role="status"
          tabIndex={-1}
          ref={notice}
        >
          출입 설정을 저장했습니다.
        </div>
      )}
      {resource.status === 'ready' ? (
        <AccessSettingsEditor
          key={`${resource.data.settings.version}:${saveCount}`}
          data={resource.data}
          token={token}
          rejectSession={rejectSession}
          onEditing={() => setSaved(false)}
          onReload={() => {
            setSaved(false);
            refresh();
          }}
          onSaved={(data) => {
            accept(data);
            setSaveCount((count) => count + 1);
            setSaved(true);
          }}
        />
      ) : (
        <div role={resource.status === 'error' ? 'alert' : 'status'}>
          <PageState
            title={
              resource.status === 'error'
                ? '출입 설정을 불러오지 못했습니다'
                : '출입 설정을 불러오는 중'
            }
            description={
              resource.status === 'error'
                ? '잠시 후 다시 불러와 주세요.'
                : '저장된 설정을 확인합니다.'
            }
          >
            {resource.status === 'error' && (
              <Button onClick={refresh}>다시 불러오기</Button>
            )}
            <Link
              className="ui-button admin-button-secondary"
              to={appRoutes.adminProperties}
            >
              휴양소 목록
            </Link>
          </PageState>
        </div>
      )}
    </div>
  );
}
