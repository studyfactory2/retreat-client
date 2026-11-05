import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type {
  AdminIssueActorDto,
  AdminIssueRecordDto,
} from '../../../../features/admin-issues/admin-issues.types';
import { ScheduleIcon } from '../../schedule/components/ScheduleIcon';
import { changedIssueContent } from '../model/issue-detail-summary';
import { issueActorRoleLabel, issueTime } from '../model/issue-presentation';

export function IssueCurrentSummary({
  issue,
  original,
  reporter,
  onNavigate,
  children,
}: {
  issue: AdminIssueRecordDto;
  original: AdminIssueRecordDto;
  reporter: AdminIssueActorDto;
  onNavigate: (to: string) => void;
  children?: ReactNode;
}) {
  const changes = changedIssueContent(issue, original);
  return (
    <section className="issue-compact-summary" aria-label="현재 신고 내용">
      <p className="issue-compact-description">
        {issue.description || '상세 내용 없음'}
      </p>
      {children}
      <details className="issue-summary-meta">
        <summary>
          신고 정보 <ScheduleIcon name="chevron" />
        </summary>
        <dl className="issue-compact-facts">
          <div>
            <dt>신고자</dt>
            <dd>
              {reporter.name}
              <span className="issue-summary-role">
                {issueActorRoleLabel(reporter.role)}
              </span>
            </dd>
          </div>
          <div>
            <dt>접수 일시</dt>
            <dd>{issueTime(issue.reportedAt)}</dd>
          </div>
          <div>
            <dt>분류</dt>
            <dd>{issue.category.name}</dd>
          </div>
          <div>
            <dt>위치</dt>
            <dd>{issue.areaLabel || '미입력'}</dd>
          </div>
          {issue.property.region && (
            <div>
              <dt>지역</dt>
              <dd>{issue.property.region}</dd>
            </div>
          )}
          <div>
            <dt>최근 변경</dt>
            <dd>
              {issueTime(issue.updatedAt)} · 버전 {issue.currentVersion}
            </dd>
          </div>
          <div>
            <dt>해결 일시</dt>
            <dd>
              {issue.resolvedAt
                ? issueTime(issue.resolvedAt)
                : '해결 기록 없음'}
            </dd>
          </div>
        </dl>
        {issue.sourceSubmissionId && (
          <Link
            className="issue-detail-source-link"
            to={`/admin/submissions/${issue.sourceSubmissionId}`}
            onClick={(event) => {
              if (
                !event.metaKey &&
                !event.ctrlKey &&
                !event.altKey &&
                !event.shiftKey
              ) {
                event.preventDefault();
                onNavigate(`/admin/submissions/${issue.sourceSubmissionId}`);
              }
            }}
          >
            원본 체크리스트 <span aria-hidden="true">↗</span>
          </Link>
        )}
        {changes.length > 0 && (
          <p className="issue-current-changed">
            <strong>변경된 항목:</strong> {changes.join(' · ')}
            <span>최초 신고 내용은 이력에서 확인하세요.</span>
          </p>
        )}
      </details>
    </section>
  );
}
