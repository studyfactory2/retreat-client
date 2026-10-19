import { useEffect, useId, useRef, useState } from 'react';
import type { AdminIssueDetailDto, AdminIssueEventDto } from '../../../../features/admin-issues/admin-issues.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { useIssueHistory } from '../hooks/use-issue-history';
import {
  issueActorRoleLabel,
  issueActorSourceLabel,
  issueEventLabel,
  issueEventTransition,
  issueStatusLabel,
  issueStatusTone,
  issueTime,
} from '../model/issue-presentation';
import { IssueRecord } from './IssueRecord';
import { IssuePhotos } from './IssuePhotos';
import '../styles/issue-evidence.css';

type Props = {
  detail: AdminIssueDetailDto;
  token: string;
  rejectSession: (token: string) => void;
  onRefreshDetail: () => void;
  onNavigate?: (to: string) => void;
};

export function IssueHistory(props: Props) {
  return <HistoryWorkspace key={`${props.detail.issue.id}:${props.detail.issue.currentVersion}`} {...props} />;
}

function HistoryWorkspace({ detail, token, rejectSession, onRefreshDetail, onNavigate }: Props) {
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { resource, refresh } = useIssueHistory(detail, page, token, rejectSession);
  const heading = useRef<HTMLHeadingElement>(null);
  const focusOnLoad = useRef(false);
  const headingId = useId();
  const expandedId = useId();
  useEffect(() => {
    if (resource.status !== 'loading' && focusOnLoad.current) {
      focusOnLoad.current = false;
      heading.current?.focus();
    }
  }, [resource.status]);
  function selectPage(next: number) {
    focusOnLoad.current = true;
    setExpanded(null);
    setPage(next);
  }
  function reload() {
    focusOnLoad.current = true;
    setExpanded(null);
    refresh();
  }
  return (
    <section className="issue-evidence-history" aria-labelledby={headingId}>
      <div className="issue-evidence-history__heading">
        <h2 id={headingId} ref={heading} tabIndex={-1}>처리 이력 <span>버전 {detail.issue.currentVersion}</span></h2>
        <Button className="admin-button-secondary" disabled={resource.status === 'loading'} onClick={reload}>이력 새로고침</Button>
      </div>
      <OriginalReport detail={detail} token={token} rejectSession={rejectSession} onNavigate={onNavigate} />
      {resource.status === 'loading' ? (
        <p className="issue-evidence-history__state" role="status">처리 이력을 불러오는 중입니다.</p>
      ) : resource.status === 'error' ? (
        <div className="issue-evidence-history__state issue-detail-error" role="alert">
          <p>{resource.message}</p>
          <Button className="admin-button-secondary" onClick={resource.changed ? onRefreshDetail : reload}>
            {resource.changed ? '최신 이상사항 불러오기' : '이력 다시 불러오기'}
          </Button>
        </div>
      ) : (
        <>
          <ol className="issue-evidence-history__list">
            {resource.data.items.map((event) => (
              <li className="issue-evidence-history__entry" key={event.id}>
                <div className="issue-evidence-history__row">
                  <div className="issue-evidence-history__description">
                    <div className="issue-evidence-history__title"><h3>{issueEventLabel(event.type)}</h3><span>버전 {event.version}</span></div>
                    <EventIdentity event={event} />
                  </div>
                  <Button
                    className="admin-button-secondary issue-evidence-history__toggle"
                    aria-expanded={expanded === event.id}
                    aria-controls={expanded === event.id ? expandedId : undefined}
                    onClick={() => setExpanded((current) => current === event.id ? null : event.id)}
                  >{expanded === event.id ? '내용 닫기' : '내용 보기'}</Button>
                </div>
                <div className="issue-evidence-history__outcome">
                  <span className={`issue-detail-badge issue-detail-badge--${issueStatusTone(event.record.status)}`}>{issueStatusLabel(event.record.status)}</span>
                  {event.record.isUrgent && <span className="issue-detail-badge issue-detail-badge--danger">긴급</span>}
                  {event.record.cancelledAt && <span className="issue-detail-badge issue-detail-badge--muted">취소됨</span>}
                  {issueEventTransition(event) && <span className="issue-evidence-history__transition">{issueEventTransition(event)}</span>}
                </div>
                {event.type === 'REPAIR_REPORTED' && <p className="issue-evidence-history__notice">직원 조치 보고이며, 관리자 해결 처리와는 별개입니다.</p>}
                {event.note && <p className="issue-evidence-history__note"><strong>메모</strong> {event.note}</p>}
                {expanded === event.id && (
                  <div id={expandedId} className="issue-evidence-history__snapshot">
                    <p className="issue-evidence-history__snapshot-label">
                      {event.version === detail.issue.currentVersion ? '현재 버전의 저장 내용' : `버전 ${event.version} 당시 내용 · 현재 내용과 다를 수 있습니다.`}
                    </p>
                    <IssueRecord record={event.record} onNavigate={onNavigate} />
                    <IssuePhotos key={`history-photo:${event.id}`} event={event} token={token} rejectSession={rejectSession} />
                  </div>
                )}
              </li>
            ))}
          </ol>
          {resource.data.totalPages > 1 && (
            <nav className="issue-detail-pagination" aria-label="처리 이력 페이지">
              <Button className="admin-button-secondary" disabled={page <= 1} onClick={() => selectPage(page - 1)}>이전</Button>
              <span aria-current="page">{page} / {resource.data.totalPages} 페이지</span>
              <Button className="admin-button-secondary" disabled={page >= resource.data.totalPages} onClick={() => selectPage(page + 1)}>다음</Button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}

function EventIdentity({ event }: { event: AdminIssueEventDto }) {
  return (
    <p className="issue-evidence-event-identity">
      <span>{event.actor.name} · {issueActorRoleLabel(event.actor.role)} · {issueActorSourceLabel(event.actorSource)}</span>
      <time dateTime={event.createdAt}>{issueTime(event.createdAt)}</time>
    </p>
  );
}

function OriginalReport({ detail, token, rejectSession, onNavigate }: Omit<Props, 'onRefreshDetail'>) {
  const { report } = detail;
  const [open, setOpen] = useState(false);
  return (
    <details className="issue-evidence-original" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary><span>최초 신고 보기</span><span aria-hidden="true">+</span></summary>
      {open && (
        <div className="issue-evidence-original__body">
          <EventIdentity event={report} />
          <p className="issue-evidence-original__context">
            {report.actor.role === 'GUEST' ? '신고자 정보는 이용객이 직접 입력했습니다.' : report.actor.role === 'STAFF' ? '신고 당시 배정된 직원 정보입니다.' : '최초 신고 당시 작성자 정보입니다.'}
          </p>
          {report.note && report.note !== report.record.description && <p className="issue-evidence-history__note"><strong>메모</strong> {report.note}</p>}
          <IssueRecord record={report.record} title="최초 신고 당시 내용" showSourceLink onNavigate={onNavigate} />
          <IssuePhotos event={report} token={token} rejectSession={rejectSession} />
        </div>
      )}
    </details>
  );
}
