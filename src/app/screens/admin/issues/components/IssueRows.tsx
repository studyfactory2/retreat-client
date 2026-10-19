import { Link } from 'react-router-dom';
import { appRoutes } from '../../../../core/router/routes';
import type {
  AdminIssueFilters,
  AdminIssueSummaryDto,
} from '../../../../features/admin-issues/admin-issues.types';
import { issueSearch } from '../model/issue-filters';
import {
  issueTime,
  issueStatusLabel,
  issueStatusTone,
} from '../model/issue-presentation';
import '../styles/issue-rows.css';

const dateFormatter = new Intl.DateTimeFormat('en', {
  timeZone: 'Asia/Seoul',
  month: 'numeric',
  day: 'numeric',
});

function shortDate(value: string): string {
  const parts = dateFormatter.formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';
  return `${part('month')}.${part('day')}`;
}

function IssueRecordDates({ issue }: { issue: AdminIssueSummaryDto }) {
  return (
    <details className="issue-record-dates">
      <summary aria-label={`${shortDate(issue.reportedAt)} 접수, 기록 시각 보기`}>
        <svg className="issue-record-calendar" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 11h18" />
        </svg>
        <time dateTime={issue.reportedAt}>{shortDate(issue.reportedAt)}</time>
        <svg className="issue-record-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="issue-record-date-content">
        <dl>
          <div><dt>접수</dt><dd><time dateTime={issue.reportedAt}>{issueTime(issue.reportedAt)}</time></dd></div>
          {issue.resolvedAt && <div><dt>해결</dt><dd><time dateTime={issue.resolvedAt}>{issueTime(issue.resolvedAt)}</time></dd></div>}
          {issue.cancelledAt && <div><dt>취소</dt><dd><time dateTime={issue.cancelledAt}>{issueTime(issue.cancelledAt)}</time></dd></div>}
        </dl>
        <p>한국 시간 기준</p>
      </div>
    </details>
  );
}

export function IssueRows({
  items,
  filters,
}: {
  items: AdminIssueSummaryDto[];
  filters: AdminIssueFilters;
}) {
  return (
    <div className="issue-records">
      <table className="issue-records-table" role="table">
        <caption className="issue-record-sr-only">접수일 최신순 이상사항 목록</caption>
        <thead role="rowgroup">
          <tr role="row">
            <th role="columnheader" scope="col">문제</th>
            <th role="columnheader" scope="col">휴양소</th>
            <th role="columnheader" scope="col">접수일</th>
            <th role="columnheader" scope="col">상태</th>
            <th role="columnheader" scope="col"><span className="issue-record-sr-only">상세</span></th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {items.map((issue) => (
            <tr role="row" key={issue.id} className={issue.cancelledAt ? 'issue-record--cancelled' : undefined}>
              <td role="cell" className="issue-record-content">
                <strong className="issue-record-title">{issue.title}</strong>
                <dl className="issue-record-context">
                  <div><dt className="issue-record-sr-only">분류</dt><dd>{issue.category.name}</dd></div>
                  {issue.areaLabel && <div><dt className="issue-record-sr-only">위치</dt><dd>{issue.areaLabel}</dd></div>}
                </dl>
              </td>
              <td role="cell" className="issue-record-property">
                <strong>{issue.property.name}</strong>
                {issue.property.region && <span>{issue.property.region}</span>}
              </td>
              <td role="cell" className="issue-record-reported">
                <IssueRecordDates issue={issue} />
              </td>
              <td role="cell" className="issue-record-state">
                <div className="issue-record-badges" aria-label="긴급도와 처리 상태">
                  {issue.isUrgent && <span className="issue-record-badge issue-record-badge--urgent">긴급</span>}
                  <span className={`issue-record-badge issue-record-badge--${issueStatusTone(issue.status)}`}>{issueStatusLabel(issue.status)}</span>
                  {issue.cancelledAt && <span className="issue-record-badge issue-record-badge--cancelled">취소됨</span>}
                </div>
              </td>
              <td role="cell" className="issue-record-action">
                <Link className="issue-record-link" to={`${appRoutes.adminIssues}/${issue.id}${issueSearch(filters)}`} aria-label={`${issue.property.name} · ${issue.title} 상세 보기`}>
                  <span aria-hidden="true">→</span> 상세
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
