import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';
import { useAdminSession } from '../../../core/session/use-admin-session';
import type { AdminPropertyDto } from '../../../features/admin-properties/admin-property-management.types';
import { Button } from '../../../shared/ui/Button/Button';
import { PageState } from '../../../shared/ui/PageState/PageState';
import { PropertyStaffAssignment } from './components/PropertyStaffAssignment';
import { useAdminProperty } from './hooks/use-admin-properties';
import './styles/properties.css';
import './styles/property-staff.css';

export function AdminPropertyStaffScreen() {
  const { id = '' } = useParams();
  const { state, rejectSession } = useAdminSession();
  if (state.status !== 'authenticated') return null;
  return (
    <AssignmentWorkspace
      key={`${id}:${state.user.id}:${state.expiresAt}`}
      id={id}
      token={state.token}
      rejectSession={rejectSession}
    />
  );
}

function AssignmentWorkspace({
  id,
  token,
  rejectSession,
}: {
  id: string;
  token: string;
  rejectSession: (token: string) => void;
}) {
  const { resource, refresh } = useAdminProperty(id, token, rejectSession);
  const [receipt, setReceipt] = useState<{
    owner: string;
    property: AdminPropertyDto;
  }>();
  const [saveCount, setSaveCount] = useState(0);
  const notice = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (saveCount) notice.current?.focus();
  }, [saveCount]);
  const property =
    receipt?.owner === token
      ? receipt.property
      : resource.status === 'ready'
        ? resource.data
        : undefined;
  return (
    <div className="admin-properties property-staff">
      {resource.status !== 'ready' || !property ? (
        <div role={resource.status === 'error' ? 'alert' : 'status'}>
          <PageState
            title={
              resource.status === 'error'
                ? '휴양소 정보를 불러오지 못했습니다'
                : '담당 직원 정보를 불러오는 중'
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
            <Link
              className="ui-button admin-button-secondary"
              to={appRoutes.adminProperties}
            >
              휴양소 목록으로 돌아가기
            </Link>
          </PageState>
        </div>
      ) : (
        <>
          {receipt?.owner === token && (
            <div
              className="properties-banner properties-banner--success"
              role="status"
              ref={notice}
              tabIndex={-1}
            >
              담당 직원 배정을 저장했습니다.
            </div>
          )}
          <PropertyStaffAssignment
            key={`${property.updatedAt}:${property.staffUserId}:${saveCount}`}
            property={property}
            token={token}
            rejectSession={rejectSession}
            onSaved={(saved) => {
              setReceipt({ owner: token, property: saved });
              setSaveCount((value) => value + 1);
            }}
            onReload={() => {
              setReceipt(undefined);
              refresh();
            }}
          />
        </>
      )}
    </div>
  );
}
