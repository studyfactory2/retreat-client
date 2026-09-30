import { Link, useNavigate, useParams } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { Button } from '../../../shared/ui/Button/Button';
import { PageState } from '../../../shared/ui/PageState/PageState';
import { ChecklistTypeCard } from './components/ChecklistTypeCard';
import { useChecklistResource } from './hooks/use-checklist-resource';
import {
  checklistEditorPath,
  checklistTypes,
} from './model/checklist-form-model';
import './styles/property-checklists.css';

export function AdminPropertyChecklistsScreen() {
  const { id = '' } = useParams();
  const { state, rejectSession } = useAdminSession();
  if (state.status !== 'authenticated') return null;
  return (
    <ChecklistWorkspace
      key={`${id}:${state.user.id}:${state.expiresAt}`}
      id={id}
      token={state.token}
      rejectSession={rejectSession}
    />
  );
}
function ChecklistWorkspace({
  id,
  token,
  rejectSession,
}: {
  id: string;
  token: string;
  rejectSession: (token: string) => void;
}) {
  const navigate = useNavigate();
  const { resource, refresh } = useChecklistResource(
    id,
    undefined,
    token,
    rejectSession,
  );
  return (
    <div className="checklist-workspace">
      <header className="checklist-heading">
        <div>
          <p className="checklist-heading__eyebrow">PROPERTY CHECKLISTS</p>
          <h1>체크리스트 관리</h1>
          <p>
            {resource.status === 'ready'
              ? resource.data.property.name
              : '휴양소별 점검 항목을 설정합니다.'}
          </p>
        </div>
        <div className="checklist-actions">
          <Link
            className="ui-button admin-button-secondary"
            to={appRoutes.adminPropertyDetail.replace(':id', id)}
          >
            휴양소 정보로 돌아가기
          </Link>
          <Button
            className="admin-button-secondary"
            disabled={resource.status === 'loading'}
            onClick={() => void refresh()}
          >
            최신 정보 불러오기
          </Button>
        </div>
      </header>
      {resource.status === 'ready' ? (
        <>
          <div className="checklist-banner">
            <strong>머무는 순간부터 정비까지, 필요한 점검을 준비하세요.</strong>
            <p>
              휴양소마다 입실·퇴실·정비 체크리스트를 각각 하나씩 설정합니다.
              입실·퇴실은 초기 설정 후 고정되며, 정비 항목은 수정할 수 있습니다.
            </p>
          </div>
          {!resource.data.property.isActive && (
            <div className="checklist-banner" role="status">
              비활성 휴양소입니다. 기존 내용은 확인할 수 있으며, 새 설정과
              수정은 휴양소 활성화 후 가능합니다.
            </div>
          )}
          <div className="checklist-type-grid">
            {checklistTypes.map((type) => (
              <ChecklistTypeCard
                key={type}
                type={type}
                template={resource.data.templates.find(
                  (item) => item.type === type,
                )}
                propertyActive={resource.data.property.isActive}
                onOpen={() => navigate(checklistEditorPath(id, type))}
              />
            ))}
          </div>
          <p className="checklist-summary">
            체크리스트 설정은 앞으로 작성할 내용에 적용됩니다. 이미 작성
            중이거나 제출된 기록의 점검 문구는 바뀌지 않습니다.
          </p>
        </>
      ) : (
        <div role={resource.status === 'error' ? 'alert' : 'status'}>
          <PageState
            title={
              resource.status === 'error'
                ? '체크리스트 정보를 불러오지 못했습니다'
                : '체크리스트를 불러오는 중'
            }
            description={
              resource.status === 'error'
                ? resource.message
                : '휴양소와 세 가지 점검 유형을 확인합니다.'
            }
          >
            {resource.status === 'error' && (
              <Button onClick={() => void refresh()}>다시 불러오기</Button>
            )}
          </PageState>
        </div>
      )}
    </div>
  );
}
