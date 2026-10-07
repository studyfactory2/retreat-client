import { useId, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { AdminIssueRecordDto } from '../../../../features/admin-issues/admin-issues.types';
import { Button } from '../../../../shared/ui/Button/Button';
import type { useIssueLinkedReport } from '../hooks/use-issue-linked-report';
import {
  issueStatusLabel,
  issueStatusTone,
  issueTime,
} from '../model/issue-presentation';

export type IssueEditorKind =
  'record' | 'urgency' | 'recurrence' | 'cancel' | 'restore';
export function IssueManagementSummary({
  issue,
  activeEditor,
  locked,
  linked,
  onLinkedRefresh,
  onEdit,
  onNavigate,
  children,
}: {
  issue: AdminIssueRecordDto;
  activeEditor: IssueEditorKind;
  locked: boolean;
  linked: ReturnType<typeof useIssueLinkedReport>['resource'];
  onLinkedRefresh: () => void;
  onEdit: (kind: IssueEditorKind) => void;
  onNavigate: (to: string) => void;
  children?: ReactNode;
}) {
  const recurrenceId = useId();
  const editable =
    issue.cancelledAt === null && issue.currentVersion <= 2_147_483_646;
  const linkedTo = issue.recurrenceOfIssueId
    ? `/admin/issues/${issue.recurrenceOfIssueId}`
    : null;
  return (
    <div className="issue-management-summary">
      <div className="issue-management-toolbar" aria-label="신고 관리 메뉴">
        {editable && activeEditor !== 'record' && (
          <Button
            className="admin-button-secondary issue-management-record-toggle"
            disabled={locked}
            onClick={() => onEdit('record')}
          >
            메모·처리 상태 기록으로
          </Button>
        )}
        {editable && (
          <>
            <Button
              className="admin-button-secondary"
              disabled={locked || activeEditor === 'urgency'}
              aria-expanded={activeEditor === 'urgency'}
              onClick={() => onEdit('urgency')}
            >
              {issue.isUrgent ? '긴급 해제' : '긴급으로 변경'}
            </Button>
            <Button
              className="admin-button-secondary"
              disabled={locked || activeEditor === 'recurrence'}
              aria-expanded={activeEditor === 'recurrence'}
              onClick={() => onEdit('recurrence')}
            >
              {issue.recurrenceOfIssueId ? '연결 변경·해제' : '이전 신고 선택'}
            </Button>
          </>
        )}
        {children}
      </div>
      {(issue.recurrenceOfIssueId ||
        linked.status === 'loading' ||
        linked.status === 'error') && (
        <section
          className="issue-management-recurrence"
          aria-labelledby={recurrenceId}
        >
          <h3 id={recurrenceId}>연결된 이전 신고</h3>
          {linked.status === 'loading' ? (
            <p className="issue-detail-caption" role="status">
              연결된 신고를 불러오는 중입니다.
            </p>
          ) : linked.status === 'ready' && linkedTo ? (
            <div className="issue-linked-report">
              <Link
                to={linkedTo}
                aria-disabled={locked || undefined}
                onClick={(event) => {
                  if (
                    locked ||
                    (!event.metaKey &&
                      !event.ctrlKey &&
                      !event.altKey &&
                      !event.shiftKey)
                  ) {
                    event.preventDefault();
                    if (!locked) onNavigate(linkedTo);
                  }
                }}
              >
                {linked.data.title}
                <span aria-hidden="true"> →</span>
              </Link>
              <div className="issue-detail-badges">
                <span
                  className={`issue-detail-badge issue-detail-badge--${issueStatusTone(linked.data.status)}`}
                >
                  {issueStatusLabel(linked.data.status)}
                </span>
                {linked.data.cancelledAt && (
                  <span className="issue-detail-badge issue-detail-badge--muted">
                    취소됨
                  </span>
                )}
                <time dateTime={linked.data.reportedAt}>
                  {issueTime(linked.data.reportedAt)}
                </time>
              </div>
            </div>
          ) : linked.status === 'error' ? (
            <div className="issue-recurrence-load-error" role="alert">
              <p>{linked.message}</p>
              <Button
                className="admin-button-secondary"
                disabled={locked}
                onClick={onLinkedRefresh}
              >
                연결된 신고 다시 불러오기
              </Button>
            </div>
          ) : (
            <p className="issue-detail-caption">연결된 이전 신고가 없습니다.</p>
          )}
        </section>
      )}
    </div>
  );
}
