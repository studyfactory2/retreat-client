import { useId, useState } from 'react';
import { Button } from '../../../../shared/ui/Button/Button';
import { SubmissionRecord } from './SubmissionRecord';
import { SubmissionPhotos } from './SubmissionPhotos';
import { SubmissionMetadata } from './SubmissionMetadata';
import {
  submissionActionLabel,
  submissionRoleLabel,
  submissionSourceLabel,
  submissionTime,
} from '../model/submission-detail-model';
import { useSubmissionHistory } from '../hooks/use-submission-history';
import '../styles/maintenance-history.css';

export function SubmissionHistory({
  submissionId,
  currentRevision,
  token,
  rejectSession,
  onRefreshDetail,
  presentation,
}: {
  submissionId: string;
  currentRevision: number;
  token: string;
  rejectSession: (token: string) => void;
  onRefreshDetail: () => void;
  presentation?: 'maintenance';
}) {
  return (
    <HistoryWorkspace
      key={`${submissionId}:${currentRevision}`}
      submissionId={submissionId}
      currentRevision={currentRevision}
      token={token}
      rejectSession={rejectSession}
      onRefreshDetail={onRefreshDetail}
      presentation={presentation}
    />
  );
}

function HistoryWorkspace({
  submissionId,
  currentRevision,
  token,
  rejectSession,
  onRefreshDetail,
  presentation,
}: {
  submissionId: string;
  currentRevision: number;
  token: string;
  rejectSession: (token: string) => void;
  onRefreshDetail: () => void;
  presentation?: 'maintenance';
}) {
  const maintenance = presentation === 'maintenance';
  const snapshotId = useId();
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { resource, refresh } = useSubmissionHistory(
    submissionId,
    currentRevision,
    page,
    token,
    rejectSession,
  );
  function selectPage(next: number) {
    setExpanded(null);
    setPage(next);
  }
  return (
    <section
      className={`submission-history${maintenance ? ' maintenance-history' : ''}`}
      aria-labelledby="submission-history-heading"
    >
      <div className="submission-detail-section-heading">
        <div>
          <h2 id="submission-history-heading">
            {maintenance ? '변경 이력' : '버전별 기록'}
          </h2>
          <p className="submission-detail-caption">
            {maintenance ? '한국 시간 기준' : '저장 당시 내용과 사진을 확인하세요.'}
          </p>
        </div>
        <Button
          className="admin-button-secondary"
          aria-label="이력 새로고침"
          disabled={resource.status === 'loading'}
          onClick={() => {
            setExpanded(null);
            refresh();
          }}
        >
          {maintenance ? '새로고침' : '이력 새로고침'}
        </Button>
      </div>
      {resource.status === 'loading' ? (
        <div className="submission-detail-card" role="status">
          제출 이력을 불러오는 중입니다.
        </div>
      ) : resource.status === 'error' ? (
        <div
          className="submission-detail-card submission-detail-error"
          role="alert"
        >
          <p>{resource.message}</p>
          <Button
            className="admin-button-secondary"
            onClick={resource.changed ? onRefreshDetail : refresh}
          >
            {resource.changed
              ? '최신 제출 내용 불러오기'
              : '이력 다시 불러오기'}
          </Button>
        </div>
      ) : (
        <>
          <ol className="submission-history-list">
            {resource.data.items.map((revision) => (
              <li className="submission-history-entry" key={revision.id}>
                {maintenance ? (
                  <div className="maintenance-history-summary">
                    <div className="maintenance-history-summary__title">
                      <h3>{submissionActionLabel(revision.action)}</h3>
                      <span className="maintenance-history-version">
                        버전 {revision.version}
                      </span>
                      <span
                        className={`submission-detail-badge ${revision.status === 'CANCELLED' ? 'submission-detail-badge--danger' : 'submission-detail-badge--success'}`}
                      >
                        {revision.status === 'CANCELLED' ? '취소됨' : '제출됨'}
                      </span>
                    </div>
                    <div className="maintenance-history-summary__meta">
                      <p className="maintenance-history-summary__actor">
                        <strong>{revision.actor.name}</strong> ·{' '}
                        {submissionRoleLabel(revision.actor.role)} ·{' '}
                        {submissionSourceLabel(revision.actorSource)}
                      </p>
                      <time
                        className="maintenance-history-summary__time"
                        dateTime={revision.createdAt}
                      >
                        {submissionTime(revision.createdAt)}
                      </time>
                    </div>
                    {revision.reason && (
                      <p className="maintenance-history-summary__reason">
                        <span>사유</span> {revision.reason}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="submission-history-entry__heading">
                      <div>
                        <h3>
                          버전 {revision.version} ·{' '}
                          {submissionActionLabel(revision.action)}
                        </h3>
                        <p>{submissionTime(revision.createdAt)}</p>
                      </div>
                      <span
                        className={`submission-detail-badge${revision.status === 'CANCELLED' ? ' submission-detail-badge--danger' : ''}`}
                      >
                        {revision.status === 'CANCELLED' ? '취소됨' : '제출됨'}
                      </span>
                    </div>
                    <p className="submission-history-actor">
                      {revision.actor.name} ·{' '}
                      {submissionRoleLabel(revision.actor.role)} ·{' '}
                      {submissionSourceLabel(revision.actorSource)}
                    </p>
                    <p className="submission-detail-text">
                      <strong>사유: </strong>
                      {revision.reason || '작성된 사유 없음'}
                    </p>
                  </>
                )}
                <Button
                  className={`admin-button-secondary${maintenance ? ' maintenance-history-toggle' : ''}`}
                  aria-expanded={expanded === revision.id}
                  aria-controls={expanded === revision.id ? `${snapshotId}-${revision.id}` : undefined}
                  aria-label={
                    maintenance
                      ? `버전 ${revision.version} 내용 ${expanded === revision.id ? '닫기' : '보기'}`
                      : undefined
                  }
                  onClick={() =>
                    setExpanded((current) =>
                      current === revision.id ? null : revision.id,
                    )
                  }
                >
                  {maintenance
                    ? expanded === revision.id
                      ? '내용 닫기'
                      : '내용 보기'
                    : expanded === revision.id
                      ? '저장 내용 닫기'
                      : '이 버전의 전체 내용 보기'}
                </Button>
                {expanded === revision.id && (
                  <div
                    className="submission-history-snapshot"
                    id={`${snapshotId}-${revision.id}`}
                  >
                    <p className="submission-detail-notice">
                      {revision.version === currentRevision
                        ? maintenance
                          ? `현재 버전 ${revision.version}의 저장 내용입니다.`
                          : '현재 버전의 저장 내용입니다.'
                        : maintenance
                          ? `버전 ${revision.version}의 과거 기록입니다. 현재 내용과 다를 수 있습니다.`
                          : `버전 ${revision.version}에 저장된 과거 기록입니다. 현재 제출 내용과 다를 수 있습니다.`}
                    </p>
                    {maintenance ? (
                      <div className="maintenance-current-record">
                        <SubmissionRecord
                          record={revision.record}
                          historical
                          presentation="maintenance"
                          includeMetadata={false}
                        />
                      </div>
                    ) : (
                      <SubmissionRecord record={revision.record} historical />
                    )}
                    <SubmissionPhotos
                      key={revision.id}
                      revision={revision}
                      token={token}
                      rejectSession={rejectSession}
                      presentation={presentation}
                    />
                    {maintenance && (
                      <SubmissionMetadata
                        record={revision.record}
                        historical
                        title="당시 기록 정보"
                        presentation="maintenance"
                      />
                    )}
                  </div>
                )}
              </li>
            ))}
          </ol>
          {resource.data.totalPages > 1 && (
            <nav
              className="submission-detail-pagination"
              aria-label="제출 이력 페이지"
            >
              <Button
                className="admin-button-secondary"
                disabled={page <= 1}
                onClick={() => selectPage(page - 1)}
              >
                이전
              </Button>
              <span>
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
