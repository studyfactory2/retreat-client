import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { Button } from '../../../shared/ui/Button/Button';
import { PageState } from '../../../shared/ui/PageState/PageState';
import { SubmissionRecord } from './components/SubmissionRecord';
import { SubmissionPhotos } from './components/SubmissionPhotos';
import { SubmissionHistory } from './components/SubmissionHistory';
import {
  submissionActionLabel,
  submissionRoleLabel,
  submissionSourceLabel,
  submissionTime,
  submissionTypeLabel,
} from './model/submission-detail-model';
import {
  readSubmissionListFilters,
  submissionListSearch,
} from './model/submission-list-model';
import { useSubmissionDetail } from './hooks/use-submission-detail';
import './styles/submission-detail.css';

export function AdminSubmissionDetailScreen() {
  const { state, rejectSession } = useAdminSession();
  const { id = '' } = useParams();
  if (state.status !== 'authenticated') return null;
  return (
    <SubmissionWorkspace
      key={`${id}:${state.user.id}:${state.expiresAt}`}
      id={id}
      token={state.token}
      rejectSession={rejectSession}
    />
  );
}

function SubmissionWorkspace({
  id,
  token,
  rejectSession,
}: {
  id: string;
  token: string;
  rejectSession: (token: string) => void;
}) {
  const { resource, refresh } = useSubmissionDetail(id, token, rejectSession);
  const [search] = useSearchParams();
  const returnTo = `/admin/submissions${submissionListSearch(readSubmissionListFilters(search))}`;
  useEffect(() => {
    if (resource.status !== 'loading')
      document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [resource.status]);
  if (resource.status !== 'ready')
    return (
      <div
        className="submission-detail"
        role={resource.status === 'error' ? 'alert' : 'status'}
      >
        <PageState
          title={
            resource.status === 'error'
              ? '제출 내용을 불러오지 못했습니다'
              : '제출 내용을 불러오는 중'
          }
          description={
            resource.status === 'error'
              ? resource.message
              : '저장된 체크리스트와 첨부 정보를 확인하고 있습니다.'
          }
        >
          {resource.status === 'error' && (
            <Button onClick={refresh}>다시 불러오기</Button>
          )}
          <Link className="ui-button admin-button-secondary" to={returnTo}>
            제출 목록으로
          </Link>
        </PageState>
      </div>
    );
  const detail = resource.data;
  const revision = detail.revision;
  return (
    <div className="submission-detail">
      <header className="submission-detail-heading">
        <div>
          <p className="submission-detail-eyebrow">SUBMISSION RECORD</p>
          <h1>{submissionTypeLabel(revision.record.type)} 상세</h1>
          <p>
            {revision.record.property.name} · {revision.record.author.name} ·{' '}
            {revision.record.visitDate}
          </p>
        </div>
        <div className="submission-detail-actions">
          <Link className="ui-button admin-button-secondary" to={returnTo}>
            제출 목록으로
          </Link>
          <Button className="admin-button-secondary" onClick={refresh}>
            새로고침
          </Button>
        </div>
      </header>
      <section className="submission-detail-card submission-current-revision">
        <div className="submission-detail-section-heading">
          <h2>현재 저장된 내용 · 버전 {detail.currentRevision}</h2>
          <span
            className={`submission-detail-badge${detail.status === 'CANCELLED' ? ' submission-detail-badge--danger' : ''}`}
          >
            {detail.status === 'CANCELLED' ? '취소됨' : '제출됨'}
          </span>
        </div>
        <p>
          {submissionActionLabel(revision.action)} ·{' '}
          {submissionTime(revision.createdAt)} · {revision.actor.name} (
          {submissionRoleLabel(revision.actor.role)} /{' '}
          {submissionSourceLabel(revision.actorSource)})
        </p>
        {revision.reason && (
          <p className="submission-detail-text">
            <strong>사유: </strong>
            {revision.reason}
          </p>
        )}
        {detail.status === 'CANCELLED' && (
          <p className="submission-detail-notice">
            취소된 제출 기록입니다. 취소 전후의 저장 내용은 아래 이력에서 확인할
            수 있습니다.
          </p>
        )}
      </section>
      <SubmissionRecord record={revision.record} />
      <SubmissionPhotos
        key={revision.id}
        revision={revision}
        token={token}
        rejectSession={rejectSession}
      />
      <SubmissionHistory
        submissionId={detail.id}
        currentRevision={detail.currentRevision}
        token={token}
        rejectSession={rejectSession}
        onRefreshDetail={refresh}
      />
    </div>
  );
}
