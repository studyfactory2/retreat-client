import { useState } from 'react';
import { Button } from '../../../../shared/ui/Button/Button';
import { SubmissionRecord } from './SubmissionRecord';
import { SubmissionPhotos } from './SubmissionPhotos';
import {
  submissionActionLabel,
  submissionRoleLabel,
  submissionSourceLabel,
  submissionTime,
} from '../model/submission-detail-model';
import { useSubmissionHistory } from '../hooks/use-submission-history';

export function SubmissionHistory({
  submissionId,
  currentRevision,
  token,
  rejectSession,
  onRefreshDetail,
}: {
  submissionId: string;
  currentRevision: number;
  token: string;
  rejectSession: (token: string) => void;
  onRefreshDetail: () => void;
}) {
  return (
    <HistoryWorkspace
      key={`${submissionId}:${currentRevision}`}
      submissionId={submissionId}
      currentRevision={currentRevision}
      token={token}
      rejectSession={rejectSession}
      onRefreshDetail={onRefreshDetail}
    />
  );
}

function HistoryWorkspace({
  submissionId,
  currentRevision,
  token,
  rejectSession,
  onRefreshDetail,
}: {
  submissionId: string;
  currentRevision: number;
  token: string;
  rejectSession: (token: string) => void;
  onRefreshDetail: () => void;
}) {
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
      className="submission-history"
      aria-labelledby="submission-history-heading"
    >
      <div className="submission-detail-section-heading">
        <div>
          <p className="submission-detail-eyebrow">SAVED HISTORY</p>
          <h2 id="submission-history-heading">제출 이력</h2>
          <p className="submission-detail-caption">
            버전별로 저장된 전체 내용과 첨부 사진을 확인합니다.
          </p>
        </div>
        <Button
          className="admin-button-secondary"
          disabled={resource.status === 'loading'}
          onClick={() => {
            setExpanded(null);
            refresh();
          }}
        >
          이력 새로고침
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
                <Button
                  className="admin-button-secondary"
                  aria-expanded={expanded === revision.id}
                  onClick={() =>
                    setExpanded((current) =>
                      current === revision.id ? null : revision.id,
                    )
                  }
                >
                  {expanded === revision.id
                    ? '저장 내용 닫기'
                    : '이 버전의 전체 내용 보기'}
                </Button>
                {expanded === revision.id && (
                  <div className="submission-history-snapshot">
                    <p className="submission-detail-notice">
                      {revision.version === currentRevision
                        ? '현재 버전의 저장 내용입니다.'
                        : `버전 ${revision.version}에 저장된 과거 기록입니다. 현재 제출 내용과 다를 수 있습니다.`}
                    </p>
                    <SubmissionRecord record={revision.record} historical />
                    <SubmissionPhotos
                      key={revision.id}
                      revision={revision}
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
