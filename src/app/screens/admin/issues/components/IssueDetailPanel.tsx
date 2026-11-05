import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../../shared/ui/Button/Button';
import { PageState } from '../../../../shared/ui/PageState/PageState';
import { IssueDetailContent } from './IssueDetailContent';
import { useIssueDetail } from '../hooks/use-issue-detail';
import '../styles/issue-detail.css';

export function IssueDetailPanel({
  id,
  token,
  adminId,
  rejectSession,
  returnTo,
  onSaved,
}: {
  id: string;
  token: string;
  adminId: string;
  rejectSession: (token: string) => void;
  returnTo: string;
  onSaved: () => void;
}) {
  const { resource, refresh, acceptSaved } = useIssueDetail(
    id,
    token,
    rejectSession,
  );
  const [lifecycleNotice, setLifecycleNotice] = useState<string>();
  useEffect(() => {
    if (resource.status !== 'loading')
      document
        .getElementById('issue-detail-region')
        ?.focus({ preventScroll: true });
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
              : '현재 신고 내용을 확인하고 있습니다.'
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
      embedded
      refresh={() => {
        setLifecycleNotice(undefined);
        refresh();
      }}
      acceptSaved={(data, version) => {
        acceptSaved(data, version);
        onSaved();
      }}
      lifecycleNotice={lifecycleNotice}
      clearLifecycleNotice={() => setLifecycleNotice(undefined)}
      onLifecycleSaved={(message) => {
        setLifecycleNotice(message);
        refresh();
        onSaved();
      }}
    />
  );
}
