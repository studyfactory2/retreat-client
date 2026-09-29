import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { Button } from '../../../shared/ui/Button/Button';
import { PageState } from '../../../shared/ui/PageState/PageState';
import { IssueDetailContent } from './components/IssueDetailContent';
import { useIssueDetail } from './hooks/use-issue-detail';
import { issueSearch, readIssueFilters } from './model/issue-filters';
import './styles/issue-detail.css';

export function AdminIssueDetailScreen() {
  const { state, rejectSession } = useAdminSession();
  const { id = '' } = useParams();
  if (state.status !== 'authenticated') return null;
  return (
    <IssueWorkspace
      key={`${id}:${state.user.id}:${state.expiresAt}`}
      id={id}
      token={state.token}
      adminId={state.user.id}
      rejectSession={rejectSession}
    />
  );
}

function IssueWorkspace({
  id,
  token,
  adminId,
  rejectSession,
}: {
  id: string;
  token: string;
  adminId: string;
  rejectSession: (token: string) => void;
}) {
  const { resource, refresh, acceptSaved } = useIssueDetail(
    id,
    token,
    rejectSession,
  );
  const [search] = useSearchParams();
  const returnTo = `/admin/issues${issueSearch(readIssueFilters(search))}`;
  useEffect(() => {
    if (resource.status !== 'loading')
      document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [resource.status]);
  if (resource.status !== 'ready')
    return (
      <div
        className="issue-detail"
        role={resource.status === 'error' ? 'alert' : 'status'}
      >
        <PageState
          title={
            resource.status === 'error'
              ? '이상사항을 불러오지 못했습니다'
              : '이상사항을 불러오는 중'
          }
          description={
            resource.status === 'error'
              ? resource.message
              : '현재 신고 내용과 저장된 이력을 확인하고 있습니다.'
          }
        >
          {resource.status === 'error' && (
            <Button onClick={refresh}>다시 불러오기</Button>
          )}
          <Link className="ui-button admin-button-secondary" to={returnTo}>
            이상사항 목록으로
          </Link>
        </PageState>
      </div>
    );
  return (
    <IssueDetailContent
      detail={resource.data}
      token={token}
      adminId={adminId}
      rejectSession={rejectSession}
      returnTo={returnTo}
      refresh={refresh}
      acceptSaved={acceptSaved}
    />
  );
}
