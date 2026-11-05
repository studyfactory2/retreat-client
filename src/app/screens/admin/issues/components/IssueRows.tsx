import { Link } from 'react-router-dom';
import { appRoutes } from '../../../../core/router/routes';
import type {
  AdminIssueFilters,
  AdminIssueSummaryDto,
} from '../../../../features/admin-issues/admin-issues.types';
import { ScheduleIcon } from '../../schedule/components/ScheduleIcon';
import { issueSearch } from '../model/issue-filters';
import { issueStatusLabel, issueStatusTone } from '../model/issue-presentation';
import '../styles/issue-rows.css';

export function IssueRows({
  items,
  filters,
  selectedId,
}: {
  items: AdminIssueSummaryDto[];
  filters: AdminIssueFilters;
  selectedId?: string;
}) {
  return (
    <div className="issue-records">
      <ul
        className="issue-record-list"
        role="list"
        aria-label="접수일 최신순 이상사항 목록"
      >
        {items.map((issue) => (
          <li key={issue.id}>
            <Link
              className={`issue-record-link${selectedId === issue.id ? ' is-selected' : ''}`}
              aria-current={selectedId === issue.id ? 'true' : undefined}
              to={`${appRoutes.adminIssues}/${issue.id}${issueSearch(filters)}`}
              aria-label={`${issue.title}, ${issue.property.name}, ${issue.isUrgent ? '긴급, ' : ''}${issueStatusLabel(issue.status)}${issue.cancelledAt ? ', 취소됨' : ''} 상세 보기`}
            >
              <span className="issue-record-content">
                <strong className="issue-record-title">{issue.title}</strong>
                {issue.isUrgent && (
                  <span className="issue-record-badge issue-record-badge--urgent">
                    긴급
                  </span>
                )}
              </span>
              <span className="issue-record-property">
                {issue.property.name}
              </span>
              <span className="issue-record-badges">
                <span
                  className={`issue-record-badge issue-record-badge--${issueStatusTone(issue.status)}`}
                >
                  {issueStatusLabel(issue.status)}
                </span>
                {issue.cancelledAt && (
                  <span className="issue-record-badge issue-record-badge--cancelled">
                    취소됨
                  </span>
                )}
              </span>
              <span className="issue-record-action" aria-hidden="true">
                <ScheduleIcon name="chevron" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
