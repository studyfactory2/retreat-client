import { useEffect, useId, useRef, useState } from 'react';
import type { AdminIssueDetailDto } from '../../../../features/admin-issues/admin-issues.types';
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

type Props = {
  detail: AdminIssueDetailDto;
  token: string;
  rejectSession: (token: string) => void;
  onRefreshDetail: () => void;
};

export function IssueHistory(props: Props) {
  return (
    <HistoryWorkspace
      key={`${props.detail.issue.id}:${props.detail.issue.currentVersion}`}
      {...props}
    />
  );
}

function HistoryWorkspace({
  detail,
  token,
  rejectSession,
  onRefreshDetail,
}: Props) {
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { resource, refresh } = useIssueHistory(
    detail,
    page,
    token,
    rejectSession,
  );
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
    <section className="issue-history" aria-labelledby={headingId}>
      <div className="issue-detail-section-heading">
        <div>
          <h2 id={headingId} ref={heading} tabIndex={-1}>
            처리 이력
          </h2>
          <p className="issue-detail-caption">
            당시 저장된 신고 내용, 메모와 첨부 사진을 확인하세요.
          </p>
        </div>
        <Button
          className="admin-button-secondary"
          disabled={resource.status === 'loading'}
          onClick={reload}
        >
          이력 새로고침
        </Button>
      </div>
      {resource.status === 'loading' ? (
        <div className="issue-detail-card" role="status">
          처리 이력을 불러오는 중입니다.
        </div>
      ) : resource.status === 'error' ? (
        <div className="issue-detail-card issue-detail-error" role="alert">
          <p>{resource.message}</p>
          <Button
            className="admin-button-secondary"
            onClick={resource.changed ? onRefreshDetail : reload}
          >
            {resource.changed ? '최신 이상사항 불러오기' : '이력 다시 불러오기'}
          </Button>
        </div>
      ) : (
        <>
          <ol className="issue-history-list">
            {resource.data.items.map((event) => (
              <li className="issue-history-entry" key={event.id}>
                <div className="issue-detail-section-heading">
                  <div>
                    <h3>
                      버전 {event.version} · {issueEventLabel(event.type)}
                    </h3>
                    <p className="issue-detail-caption">
                      {issueTime(event.createdAt)}
                    </p>
                  </div>
                  <div className="issue-detail-badges">
                    <span
                      className={`issue-detail-badge issue-detail-badge--${issueStatusTone(event.record.status)}`}
                    >
                      {issueStatusLabel(event.record.status)}
                    </span>
                    {event.record.cancelledAt && (
                      <span className="issue-detail-badge issue-detail-badge--muted">
                        취소됨
                      </span>
                    )}
                  </div>
                </div>
                <p className="issue-detail-caption">
                  {event.actor.name} · {issueActorRoleLabel(event.actor.role)} ·{' '}
                  {issueActorSourceLabel(event.actorSource)}
                </p>
                {issueEventTransition(event) && (
                  <p className="issue-detail-transition">
                    {issueEventTransition(event)}
                  </p>
                )}
                {event.type === 'REPAIR_REPORTED' && (
                  <p className="issue-detail-caption">
                    직원이 남긴 조치 보고입니다. 관리자 해결 처리와 구분해
                    확인하세요.
                  </p>
                )}
                <p className="issue-detail-text">
                  <strong>메모: </strong>
                  {event.note || '작성된 메모 없음'}
                </p>
                <Button
                  className="admin-button-secondary"
                  aria-expanded={expanded === event.id}
                  aria-controls={expanded === event.id ? expandedId : undefined}
                  onClick={() =>
                    setExpanded((current) =>
                      current === event.id ? null : event.id,
                    )
                  }
                >
                  {expanded === event.id
                    ? '저장 내용 닫기'
                    : '이 버전의 전체 내용 보기'}
                </Button>
                {expanded === event.id && (
                  <div id={expandedId} className="issue-history-snapshot">
                    <p className="issue-detail-notice">
                      {event.version === detail.issue.currentVersion
                        ? '현재 버전의 저장 내용입니다.'
                        : `버전 ${event.version}에 저장된 과거 기록입니다. 현재 내용과 다를 수 있습니다.`}
                    </p>
                    <IssueRecord record={event.record} />
                    <IssuePhotos
                      key={`history-photo:${event.id}`}
                      event={event}
                      token={token}
                      rejectSession={rejectSession}
                    />
                  </div>
                )}
              </li>
            ))}
          </ol>
          {resource.data.totalPages > 1 && (
            <nav
              className="issue-detail-pagination"
              aria-label="처리 이력 페이지"
            >
              <Button
                className="admin-button-secondary"
                disabled={page <= 1}
                onClick={() => selectPage(page - 1)}
              >
                이전
              </Button>
              <span aria-current="page">
                {page} / {resource.data.totalPages} 페이지
              </span>
              <Button
                className="admin-button-secondary"
                disabled={page >= resource.data.totalPages}
                onClick={() => selectPage(page + 1)}
              >
                다음
              </Button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
