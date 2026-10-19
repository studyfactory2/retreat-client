import { Link } from 'react-router-dom';
import type { AdminIssueActorDto, AdminIssueRecordDto } from '../../../../features/admin-issues/admin-issues.types';
import { changedIssueContent } from '../model/issue-detail-summary';
import { issueActorRoleLabel, issueTime } from '../model/issue-presentation';

const reportDate = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
});

export function IssueCurrentSummary({ issue, original, reporter, onNavigate }: {
  issue: AdminIssueRecordDto;
  original: AdminIssueRecordDto;
  reporter: AdminIssueActorDto;
  onNavigate: (to: string) => void;
}) {
  const changes = changedIssueContent(issue, original);
  return (
    <section className="issue-compact-summary" aria-label="현재 신고 내용">
      <p className="issue-compact-description">{issue.description || '상세 내용 없음'}</p>
      <dl className="issue-compact-facts">
        <div><dt>신고자</dt><dd>{reporter.name}<span className="issue-summary-role">{issueActorRoleLabel(reporter.role)}</span></dd></div>
        <div><dt>접수일</dt><dd><time dateTime={issue.reportedAt}>{reportDate.format(new Date(issue.reportedAt))}</time></dd></div>
        <div><dt>분류</dt><dd>{issue.category.name}</dd></div>
        {issue.areaLabel && <div><dt>위치</dt><dd>{issue.areaLabel}</dd></div>}
      </dl>
      {issue.sourceSubmissionId && (
        <Link className="issue-detail-source-link" to={`/admin/submissions/${issue.sourceSubmissionId}`}
          onClick={(event) => {
            if (!event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
              event.preventDefault();
              onNavigate(`/admin/submissions/${issue.sourceSubmissionId}`);
            }
          }}>
          원본 체크리스트 <span aria-hidden="true">↗</span>
        </Link>
      )}
      {changes.length > 0 && (
        <p className="issue-current-changed">
          <strong>변경된 항목:</strong> {changes.join(' · ')}
          <span>신고 당시 내용은 이력의 최초 신고에서 확인할 수 있습니다.</span>
        </p>
      )}
      <details className="issue-summary-meta">
        <summary>기록 정보 <span aria-hidden="true">＋</span></summary>
        <dl className="issue-compact-facts issue-compact-audit">
          <div><dt>접수 일시</dt><dd>{issueTime(issue.reportedAt)}</dd></div>
          <div><dt>최근 변경</dt><dd>{issueTime(issue.updatedAt)} · 버전 {issue.currentVersion}</dd></div>
          <div><dt>긴급 여부</dt><dd>{issue.isUrgent ? '긴급' : '일반'}</dd></div>
          {!issue.areaLabel && <div><dt>위치</dt><dd>미입력</dd></div>}
          <div><dt>해결 일시</dt><dd>{issue.resolvedAt ? issueTime(issue.resolvedAt) : '해결 기록 없음'}</dd></div>
        </dl>
      </details>
    </section>
  );
}
