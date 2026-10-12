import { Link } from 'react-router-dom';
import { appRoutes } from '../../../../core/router/routes';
import type {
  AdminIssueFilters,
  AdminIssueSummaryDto,
} from '../../../../features/admin-issues/admin-issues.types';
import { issueSearch } from '../model/issue-filters';
import {
  issueListTime,
  issueStatusLabel,
  issueStatusTone,
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
          <tr role="row">
            <th role="columnheader" scope="col">
              휴양소
            </th>
            <th role="columnheader" scope="col">
              처리 상태
            </th>
            <th role="columnheader" scope="col">
              신고 내용
            </th>
            <th role="columnheader" scope="col">
              접수일
            </th>
            <th role="columnheader" scope="col">
              상세
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((issue) => (
            <tr
              role="row"
              key={issue.id}
              className={issue.cancelledAt ? 'issue-row--cancelled' : undefined}
            >
              <td role="cell" className="issue-row-property">
                <strong>{issue.property.name}</strong>
                {issue.property.region && (
                  <p className="issue-list-muted">{issue.property.region}</p>
                )}
              </td>
              <td role="cell" className="issue-row-state">
                <div
                  className="issue-row-labels"
                  aria-label="긴급도와 처리 상태"
                >
                  {issue.isUrgent && (
                    <span className="issue-list-urgent">긴급</span>
                  )}
                  <span
                    className={`issue-list-status issue-list-status--${issueStatusTone(issue.status)}`}
                  >
                    {issueStatusLabel(issue.status)}
                  </span>
                  {issue.cancelledAt && (
                    <span className="issue-list-cancelled">취소됨</span>
                  )}
                </div>
                {issue.resolvedAt && (
                  <p className="issue-list-muted issue-row-resolved">
                    해결{' '}
                    <time dateTime={issue.resolvedAt}>
                      {issueListTime(issue.resolvedAt)}
                    </time>
                  </p>
                )}
              </td>
              <td role="cell" className="issue-row-content">
                <Link
                  className="issue-row-title"
                  to={`${appRoutes.adminIssues}/${issue.id}${issueSearch(filters)}`}
                >
                  {issue.title}
                </Link>
                <dl className="issue-row-context">
                  {issue.areaLabel && (
                    <div>
                      <dt>위치</dt>
                      <dd>{issue.areaLabel}</dd>
                    </div>
                  )}
                  <div>
                    <dt>분류</dt>
                    <dd>{issue.category.name}</dd>
                  </div>
                </dl>
              </td>
              <td role="cell" className="issue-row-reported">
                <span className="issue-list-mobile-label">접수</span>
                <time dateTime={issue.reportedAt}>
                  {issueListTime(issue.reportedAt)}
                </time>
              </td>
              <td role="cell" className="issue-row-action">
                <Link
                  className="issue-list-link"
                  to={`${appRoutes.adminIssues}/${issue.id}${issueSearch(filters)}`}
                  aria-label={`${issue.property.name} · ${issue.title} 신고 내용 보기`}
                >
                  <span>신고 내용 보기</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
