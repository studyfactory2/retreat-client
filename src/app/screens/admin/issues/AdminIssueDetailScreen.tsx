import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAdminSession } from '../../../core/session/use-admin-session';
import type { AdminIssueEventDto } from '../../../features/admin-issues/admin-issues.types';
import { Button } from '../../../shared/ui/Button/Button';
import { PageState } from '../../../shared/ui/PageState/PageState';
import { IssueRecord } from './components/IssueRecord';
import { IssuePhotos } from './components/IssuePhotos';
import { IssueHistory } from './components/IssueHistory';
import { useIssueDetail } from './hooks/use-issue-detail';
import { issueSearch, readIssueFilters } from './model/issue-filters';
import {
  issueActorRoleLabel,
  issueActorSourceLabel,
  issueEventLabel,
  issueEventTransition,
  issueTime,
} from './model/issue-presentation';
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
      rejectSession={rejectSession}
    />
  );
}

function IssueWorkspace({
  id,
  token,
  rejectSession,
}: {
  id: string;
  token: string;
  rejectSession: (token: string) => void;
}) {
  const { resource, refresh } = useIssueDetail(id, token, rejectSession);
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
  const { issue, report, latestEvent } = resource.data;
  return (
    <div className="issue-detail">
      <header className="issue-detail-heading">
        <div>
          <p className="issue-detail-eyebrow">신고 내용과 처리 기록</p>
          <h1>이상사항 상세</h1>
          <p>
            {issue.property.name} · {issue.category.name}
          </p>
        </div>
        <div className="issue-detail-actions">
          <Link className="ui-button admin-button-secondary" to={returnTo}>
            이상사항 목록으로
          </Link>
          <Button className="admin-button-secondary" onClick={refresh}>
            새로고침
          </Button>
        </div>
      </header>
      {issue.cancelledAt && (
        <div className="issue-detail-cancelled" role="status">
          <strong>취소된 이상사항입니다.</strong>
          <p>
            최초 신고와 이후 이력은 확인할 수 있습니다. 일반 목록에는 표시되지
            않습니다.
          </p>
        </div>
      )}
      <section aria-labelledby="issue-current-heading">
        <div className="issue-detail-section-heading">
          <h2 id="issue-current-heading">현재 저장된 내용</h2>
          <p className="issue-detail-caption">
            버전 {issue.currentVersion} · 한국 시간
          </p>
        </div>
        <IssueRecord record={issue} title="현재 이상사항" showSourceLink />
      </section>
      <section
        className="issue-original-report"
        aria-labelledby="issue-report-heading"
      >
        <div className="issue-detail-section-heading">
          <div>
            <h2 id="issue-report-heading">최초 신고</h2>
            <p className="issue-detail-caption">
              처리 이력이 추가되어도 최초 신고자와 당시 내용은 별도로
              보존됩니다.
            </p>
          </div>
        </div>
        <div className="issue-detail-card">
          <EventSummary event={report} />
          <p className="issue-detail-notice">
            {report.actor.role === 'GUEST'
              ? '이용객이 직접 입력한 신고자 정보입니다.'
              : report.actor.role === 'STAFF'
                ? '신고 당시 휴양소에 배정된 직원 정보가 기록되었습니다.'
                : '최초 신고 당시 기록된 작성자 정보입니다.'}
          </p>
          <IssueRecord record={report.record} title="최초 신고 내용" />
          <IssuePhotos
            key={`report:${report.id}`}
            event={report}
            token={token}
            rejectSession={rejectSession}
          />
        </div>
      </section>
      {latestEvent.id !== report.id && (
        <section
          className="issue-detail-card"
          aria-labelledby="issue-latest-heading"
        >
          <div className="issue-detail-section-heading">
            <h2 id="issue-latest-heading">최근 처리 기록</h2>
            <p className="issue-detail-caption">버전 {latestEvent.version}</p>
          </div>
          <EventSummary event={latestEvent} />
          <IssuePhotos
            key={`latest:${latestEvent.id}`}
            event={latestEvent}
            token={token}
            rejectSession={rejectSession}
          />
        </section>
      )}
      <IssueHistory
        detail={resource.data}
        token={token}
        rejectSession={rejectSession}
        onRefreshDetail={refresh}
      />
    </div>
  );
}

function EventSummary({ event }: { event: AdminIssueEventDto }) {
  return (
    <div className="issue-event-summary">
      <h3>{issueEventLabel(event.type)}</h3>
      <p className="issue-detail-caption">
        {event.actor.name} · {issueActorRoleLabel(event.actor.role)} ·{' '}
        {issueActorSourceLabel(event.actorSource)}
      </p>
      <p className="issue-detail-caption">{issueTime(event.createdAt)}</p>
      {issueEventTransition(event) && (
        <p className="issue-detail-transition">{issueEventTransition(event)}</p>
      )}
      {event.type === 'REPAIR_REPORTED' && (
        <p className="issue-detail-notice">
          직원이 남긴 조치 보고입니다. 관리자 해결 처리와 구분해 확인하세요.
        </p>
      )}
      {event.note && (
        <p className="issue-detail-text">
          <strong>메모: </strong>
          {event.note}
        </p>
      )}
    </div>
  );
}
