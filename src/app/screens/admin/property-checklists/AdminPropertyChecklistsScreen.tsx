import { useNavigate, useParams } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { Button } from '../../../shared/ui/Button/Button';
import { PageState } from '../../../shared/ui/PageState/PageState';
import { AdminBackButton } from '../components/AdminBackButton';
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
          <p className="checklist-heading__eyebrow">휴양소 설정</p>
          <div className="admin-page-heading-title">
            <AdminBackButton
              fallback={appRoutes.adminPropertyDetail.replace(':id', id)}
              label="이전 페이지로 돌아가기"
            />
            <h1>체크리스트 관리</h1>
          </div>
          <p>
            {resource.status === 'ready'
              ? resource.data.property.name
              : '휴양소별 점검 항목을 설정합니다.'}
          </p>
        </div>
        <div className="checklist-actions">
          <Button
            className="admin-button-secondary"
            disabled={resource.status === 'loading'}
            onClick={() => void refresh()}
          >
            새로고침
          </Button>
        </div>
      </header>
      {resource.status === 'ready' ? (
        <>
          <p className="checklist-scope-note">
            입실·퇴실·정비 항목을 수정하고 버전별 구성을 확인하세요.
          </p>
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
                onHistory={() =>
                  navigate(`${checklistEditorPath(id, type)}/history`)
                }
              />
            ))}
          </div>
          <p className="checklist-scope-note checklist-scope-note--footer">
            변경 내용은 새로 시작하는 점검부터 적용됩니다. 작성 중인 점검과 제출
            기록은 유지됩니다.
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
