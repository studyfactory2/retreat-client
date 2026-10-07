import { useEffect, useId, useRef } from 'react';
import type { AdminIssueSummaryDto } from '../../../../features/admin-issues/admin-issues.types';
import { Button } from '../../../../shared/ui/Button/Button';
import type { useIssueRecurrenceCandidates } from '../hooks/use-issue-recurrence-candidates';
import {
  issueStatusLabel,
  issueStatusTone,
  issueTime,
} from '../model/issue-presentation';

export type IssueCandidateResource = ReturnType<
  typeof useIssueRecurrenceCandidates
>['resource'];

export function IssueRecurrenceCandidates({
  resource,
  page,
  selectedId,
  locked,
  onSelect,
  onPage,
  onRetry,
  onReload,
}: {
  resource: IssueCandidateResource;
  page: number;
  selectedId: string | null | undefined;
  locked: boolean;
  onSelect: (issue: AdminIssueSummaryDto) => void;
  onPage: (page: number) => void;
  onRetry: () => void;
  onReload: () => void;
}) {
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const pageChanged = useRef(false);
  useEffect(() => {
    if (pageChanged.current && resource.status !== 'loading') {
      pageChanged.current = false;
      heading.current?.focus();
    }
  }, [resource.status]);
  return (
    <section className="issue-recurrence-candidates" aria-labelledby={id}>
      <h3 id={id} ref={heading} tabIndex={-1}>
        연결할 이전 신고 선택
      </h3>
      {resource.status === 'loading' ? (
        <p className="issue-detail-caption" role="status">
          이전 신고를 불러오는 중입니다.
        </p>
      ) : resource.status === 'error' ? (
        <div className="issue-action-notice" role="alert">
          <p>{resource.message}</p>
          <Button
            className="admin-button-secondary"
            disabled={resource.changed ? false : locked}
            onClick={resource.changed ? onReload : onRetry}
          >
            {resource.changed ? '최신 기록 확인' : '목록 다시 불러오기'}
          </Button>
        </div>
      ) : (
        <>
          {resource.data.items.length === 0 ? (
            <p className="issue-detail-caption">
              연결할 수 있는 이전 신고가 없습니다. 같은 휴양소에서 더 먼저
              접수된 신고만 표시됩니다.
            </p>
          ) : (
            <fieldset disabled={locked}>
              <legend className="issue-action-sr-only">이전 신고</legend>
              {resource.data.items.map((candidate) => (
                <label
                  className={`issue-candidate${selectedId === candidate.id ? ' is-selected' : ''}`}
                  key={candidate.id}
                >
                  <input
                    type="radio"
                    name={id}
                    checked={selectedId === candidate.id}
                    onChange={() => onSelect(candidate)}
                  />
                  <span className="issue-candidate__body">
                    <strong>{candidate.title}</strong>
                    <span>
                      {candidate.category.name}
                      {candidate.areaLabel ? ` · ${candidate.areaLabel}` : ''}
                    </span>
                    <time dateTime={candidate.reportedAt}>
                      {issueTime(candidate.reportedAt)}
                    </time>
                  </span>
                  <span
                    className={`issue-detail-badge issue-detail-badge--${issueStatusTone(candidate.status)}`}
                  >
                    {issueStatusLabel(candidate.status)}
                  </span>
                </label>
              ))}
            </fieldset>
          )}
          {page > Math.max(1, resource.data.totalPages) ? (
            <div className="issue-detail-pagination" role="status">
              <span>
                목록이 변경되었습니다. 첫 페이지부터 다시 확인해 주세요.
              </span>
              <Button
                className="admin-button-secondary"
                disabled={locked}
                onClick={() => {
                  pageChanged.current = true;
                  onPage(1);
                }}
              >
                첫 페이지로
              </Button>
            </div>
          ) : (
            resource.data.totalPages > 1 && (
              <nav
                className="issue-detail-pagination"
                aria-label="이전 신고 페이지"
              >
                <Button
                  className="admin-button-secondary"
                  disabled={locked || page <= 1}
                  onClick={() => {
                    pageChanged.current = true;
                    onPage(page - 1);
                  }}
                >
                  이전
                </Button>
                <span aria-current="page">
                  {page} / {resource.data.totalPages} 페이지
                </span>
                <Button
                  className="admin-button-secondary"
                  disabled={locked || page >= resource.data.totalPages}
                  onClick={() => {
                    pageChanged.current = true;
                    onPage(page + 1);
                  }}
                >
                  다음
                </Button>
              </nav>
            )
          )}
        </>
      )}
    </section>
  );
}
