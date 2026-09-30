import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { Button } from '../../../shared/ui/Button/Button';
import { PageState } from '../../../shared/ui/PageState/PageState';
import { PropertyGuideEditor } from './components/PropertyGuideEditor';
import { usePropertyGuide } from './hooks/use-property-guide';
import './styles/property-guide.css';

export function AdminPropertyGuideScreen() {
  const { id = '' } = useParams();
  const { state, rejectSession } = useAdminSession();
  if (state.status !== 'authenticated') return null;
  return (
    <GuideWorkspace
      key={`${id}:${state.user.id}:${state.expiresAt}`}
      propertyId={id}
      token={state.token}
      actorId={state.user.id}
      rejectSession={rejectSession}
    />
  );
}

function GuideWorkspace({
  propertyId,
  token,
  actorId,
  rejectSession,
}: {
  propertyId: string;
  token: string;
  actorId: string;
  rejectSession: (token: string) => void;
}) {
  const { resource, refresh, accept } = usePropertyGuide(
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
    <div className="property-guide-workspace">
      {saved && (
        <div
          className="property-guide-banner property-guide-banner--success"
          role="status"
          tabIndex={-1}
          ref={notice}
        >
          이용 안내를 저장했습니다.
        </div>
      )}
      {resource.status === 'ready' ? (
        <PropertyGuideEditor
          key={`${resource.data.guide?.version ?? 0}:${saveCount}`}
          data={resource.data}
          token={token}
          actorId={actorId}
          rejectSession={rejectSession}
          onEditing={() => setSaved(false)}
          onReload={() => {
            setSaved(false);
            refresh();
          }}
          onSaved={(data) => {
            accept(data);
            setSaveCount((value) => value + 1);
            setSaved(true);
          }}
        />
      ) : (
        <div role={resource.status === 'error' ? 'alert' : 'status'}>
          <PageState
            title={
              resource.status === 'error'
                ? '이용 안내를 불러오지 못했습니다'
                : '이용 안내를 불러오는 중'
            }
            description={
              resource.status === 'error'
                ? '휴양소와 안내 정보를 확인하지 못했습니다. 다시 불러와 주세요.'
                : '저장된 내용과 공개 상태를 확인합니다.'
            }
          >
            {resource.status === 'error' && (
              <Button onClick={refresh}>다시 불러오기</Button>
            )}
            <Link
              className="ui-button admin-button-secondary"
              to={appRoutes.adminProperties}
            >
              휴양소 목록으로 돌아가기
            </Link>
          </PageState>
        </div>
      )}
    </div>
  );
}
