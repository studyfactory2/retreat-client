import { Link } from 'react-router-dom';
import { appRoutes } from '../../../../core/router/routes';
import type {
  AdminIssueFilters,
  AdminIssueSummaryDto,
} from '../../../../features/admin-issues/admin-issues.types';
import { issueSearch } from '../model/issue-filters';
import {
  issueStatusLabel,
  issueStatusTone,
  issueTime,
} from '../model/issue-presentation';

export function IssueRows({
  items,
  filters,
}: {
  items: AdminIssueSummaryDto[];
  filters: AdminIssueFilters;
}) {
  return (
    <div className="issue-table-wrap">
      <table className="issue-table" role="table">
        <caption className="issue-list-sr-only">
          접수일이 최근인 순서로 정렬된 이상사항 목록
        </caption>
        <thead>
          <tr>
            <th scope="col">신고 내용</th>
            <th scope="col">휴양소</th>
            <th scope="col">처리 상태</th>
            <th scope="col">접수일</th>
            <th scope="col">상세</th>
          </tr>
        </thead>
        <tbody>
          {items.map((issue) => (
            <tr key={issue.id}>
              <td>
                <div className="issue-row-labels">
                  {issue.isUrgent && (
                    <span className="issue-list-urgent">긴급</span>
                  )}
                  <span>{issue.category.name}</span>
                </div>
                <strong className="issue-row-title">{issue.title}</strong>
                {issue.areaLabel && (
                  <p className="issue-list-muted">{issue.areaLabel}</p>
                )}
              </td>
              <td>
                <span className="issue-list-mobile-label">휴양소</span>
                <strong>{issue.property.name}</strong>
                {issue.property.region && (
                  <p className="issue-list-muted">{issue.property.region}</p>
                )}
              </td>
              <td>
                <span className="issue-list-mobile-label">처리 상태</span>
                <span
                  className={`issue-list-status issue-list-status--${issueStatusTone(issue.status)}`}
                >
                  {issueStatusLabel(issue.status)}
                </span>
                {issue.resolvedAt && (
                  <p className="issue-list-muted">
                    해결{' '}
                    <time dateTime={issue.resolvedAt}>
                      {issueTime(issue.resolvedAt)}
                    </time>
                  </p>
                )}
              </td>
              <td>
                <span className="issue-list-mobile-label">접수일</span>
                <time dateTime={issue.reportedAt}>
                  {issueTime(issue.reportedAt)}
                </time>
              </td>
              <td>
                <Link
                  className="issue-list-link"
                  to={`${appRoutes.adminIssues}/${issue.id}${issueSearch(filters)}`}
                  aria-label={`${issue.property.name} · ${issue.title} 상세 보기`}
                >
                  상세 보기<span aria-hidden="true">→</span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
