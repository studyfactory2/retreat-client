import type { AdminIssueRecordDto } from '../../../../features/admin-issues/admin-issues.types';
import { changedIssueContent } from '../model/issue-detail-summary';
import {
  issueStatusLabel,
  issueStatusTone,
  issueTime,
} from '../model/issue-presentation';

export function IssueCurrentSummary({
  issue,
  original,
}: {
  issue: AdminIssueRecordDto;
  original: AdminIssueRecordDto;
}) {
  const changes = changedIssueContent(issue, original);
  return (
    <section
      className="issue-detail-card issue-current-summary"
      aria-labelledby="issue-current-heading"
    >
      <div className="issue-detail-section-heading">
        <span className="issue-detail-eyebrow">현재 저장된 내용</span>
        <div
          className="issue-detail-badges"
          aria-label="현재 처리 상태와 긴급도"
        >
          <span
            className={`issue-detail-badge issue-detail-badge--${issueStatusTone(issue.status)}`}
          >
            {issueStatusLabel(issue.status)}
          </span>
          <span
            className={`issue-detail-badge issue-detail-badge--${issue.isUrgent ? 'danger' : 'muted'}`}
          >
            {issue.isUrgent ? '긴급' : '일반'}
          </span>
          {issue.cancelledAt && (
            <span className="issue-detail-badge issue-detail-badge--muted">
              취소됨
            </span>
          )}
        </div>
      </div>
      <h2 id="issue-current-heading">{issue.title}</h2>
      <p className="issue-current-location">
        <strong>{issue.property.name}</strong>
        {issue.property.region && <span>{issue.property.region}</span>}
        <span>{issue.areaLabel || '위치 미입력'}</span>
        <span>{issue.category.name}</span>
      </p>
      <p className="issue-detail-text">
        {issue.description || '작성된 상세 내용이 없습니다.'}
      </p>
      {changes.length > 0 && (
        <p className="issue-current-changed">
          <strong>최초 신고와 달라진 항목:</strong> {changes.join(' · ')}. 아래
          최초 신고에서 당시 내용을 확인할 수 있습니다.
        </p>
      )}
      <dl className="issue-current-dates">
        <div>
          <dt>접수</dt>
          <dd>{issueTime(issue.reportedAt)}</dd>
        </div>
        {issue.resolvedAt && (
          <div>
            <dt>해결</dt>
            <dd>{issueTime(issue.resolvedAt)}</dd>
          </div>
        )}
        <div>
          <dt>최근 변경</dt>
          <dd>
            {issueTime(issue.updatedAt)} · 버전 {issue.currentVersion}
          </dd>
        </div>
      </dl>
    </section>
  );
}
