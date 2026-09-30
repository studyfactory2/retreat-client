import { useRef, useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';
import { useAdminSession } from '../../../core/session/use-admin-session';
import type { ChecklistType } from '../../../features/admin-checklist-templates/admin-checklist-template.types';
import { Button } from '../../../shared/ui/Button/Button';
import { PageState } from '../../../shared/ui/PageState/PageState';
import { ChecklistEditor } from './components/ChecklistEditor';
import { useChecklistResource } from './hooks/use-checklist-resource';
import { parseChecklistType } from './model/checklist-form-model';
import './styles/property-checklists.css';

export function AdminChecklistEditorScreen() {
  const { id = '', type: segment } = useParams();
  const { state, rejectSession } = useAdminSession();
  const type = parseChecklistType(segment);
  if (state.status !== 'authenticated') return null;
  if (!type)
    return (
      <PageState
        title="체크리스트 유형을 확인해 주세요"
        description="입실·퇴실·정비 체크리스트에서 선택해 주세요."
      >
        <Link className="ui-button" to={appRoutes.adminProperties}>
          휴양소 목록으로 돌아가기
        </Link>
      </PageState>
    );
  return (
    <EditorWorkspace
      key={`${id}:${type}:${state.user.id}:${state.expiresAt}`}
      id={id}
      type={type}
      token={state.token}
      rejectSession={rejectSession}
    />
  );
}
function EditorWorkspace({
  id,
  type,
  token,
  rejectSession,
}: {
  id: string;
  type: ChecklistType;
  token: string;
  rejectSession: (token: string) => void;
}) {
  const { resource, refresh, accept } = useChecklistResource(
    id,
    type,
    token,
    rejectSession,
  );
  const [saveCount, setSaveCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const notice = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (saved) notice.current?.focus();
  }, [saved, saveCount]);
  const returnUrl = appRoutes.adminPropertyChecklists.replace(':id', id);
  return (
    <div className="checklist-workspace">
      {saved && (
        <div
          className="checklist-banner checklist-banner--success"
          role="status"
          ref={notice}
          tabIndex={-1}
        >
          체크리스트를 저장했습니다.
        </div>
      )}
      {resource.status === 'ready' ? (
        <ChecklistEditor
          key={`${resource.data.template?.id ?? 'new'}:${resource.data.template?.version ?? 0}:${saveCount}`}
          data={resource.data}
          type={type}
          token={token}
          rejectSession={rejectSession}
          returnUrl={returnUrl}
          onEditing={() => setSaved(false)}
          onSaved={(template) => {
            accept(template);
            setSaveCount((count) => count + 1);
            setSaved(true);
          }}
          onReload={() => {
            setSaved(false);
            void refresh();
          }}
        />
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
                : '최신 점검 항목을 확인합니다.'
            }
          >
            {resource.status === 'error' && (
              <Button onClick={() => void refresh()}>다시 불러오기</Button>
            )}
            <Link className="ui-button admin-button-secondary" to={returnUrl}>
              목록으로 돌아가기
            </Link>
          </PageState>
        </div>
      )}
    </div>
  );
}
