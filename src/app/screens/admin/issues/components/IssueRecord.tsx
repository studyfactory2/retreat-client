import { Link } from 'react-router-dom';
import type { AdminIssueRecordDto } from '../../../../features/admin-issues/admin-issues.types';
import {
  issueChecklistLabel,
  issueStatusLabel,
  issueStatusTone,
  issueTime,
} from '../model/issue-presentation';
import '../styles/issue-evidence.css';

export function IssueRecord({
  record,
  title = '저장된 신고 내용',
  showSourceLink = false,
  onNavigate,
}: {
  record: AdminIssueRecordDto;
  title?: string;
  showSourceLink?: boolean;
  onNavigate?: (to: string) => void;
}) {
  return (
    <section className="issue-evidence-record" aria-label={title}>
      <div className="issue-evidence-record__heading">
        <h3>{record.title}</h3>
        <div className="issue-detail-badges">
          <span className={`issue-detail-badge issue-detail-badge--${issueStatusTone(record.status)}`}>
            {issueStatusLabel(record.status)}
          </span>
          {record.isUrgent && <span className="issue-detail-badge issue-detail-badge--danger">긴급</span>}
          {record.cancelledAt && <span className="issue-detail-badge issue-detail-badge--muted">취소됨</span>}
        </div>
      </div>
      <p className="issue-evidence-record__description">{record.description || '상세 내용 없음'}</p>
      <dl className="issue-evidence-facts">
        <div className="issue-evidence-facts__wide">
          <dt>휴양소</dt>
          <dd>{record.property.name}{record.property.region && <span className="issue-detail-muted"> · {record.property.region}</span>}</dd>
        </div>
        <div><dt>분류</dt><dd>{record.category.name}</dd></div>
        <div><dt>위치</dt><dd>{record.areaLabel || '미입력'}</dd></div>
        <div><dt>접수 일시</dt><dd>{issueTime(record.reportedAt)}</dd></div>
        <div><dt>변경 일시</dt><dd>{issueTime(record.updatedAt)}</dd></div>
      </dl>
      <details className="issue-evidence-metadata">
        <summary>추가 기록 정보 <span aria-hidden="true">+</span></summary>
        <dl className="issue-evidence-facts">
          <div><dt>해결 일시</dt><dd>{record.resolvedAt ? issueTime(record.resolvedAt) : '해결 기록 없음'}</dd></div>
          <div>
            <dt>이전 신고</dt>
            <dd>{record.recurrenceOfIssueId ? (
              <Link
                className="issue-detail-source-link"
                to={`/admin/issues/${record.recurrenceOfIssueId}`}
                onClick={(event) => {
                  if (onNavigate && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
                    event.preventDefault();
                    onNavigate(`/admin/issues/${record.recurrenceOfIssueId}`);
                  }
                }}
              >연결된 이전 이상사항 보기 <span aria-hidden="true">→</span></Link>
            ) : '연결 없음'}</dd>
          </div>
          <div className="issue-evidence-facts__wide">
            <dt>신고 경로</dt>
            <dd>{record.source ? <>{issueChecklistLabel(record.source.checklistType)} · {record.source.templateTitle}<span className="issue-detail-muted"> · 양식 버전 {record.source.templateVersion}</span></> : '별도 불편사항 신고'}</dd>
          </div>
        </dl>
      </details>
      {record.cancelledAt && (
        <div className="issue-evidence-cancellation">
          <strong>신고 취소 · {issueTime(record.cancelledAt)}</strong>
          <p>{record.cancellationReason || '취소 사유 없음'}</p>
        </div>
      )}
      {showSourceLink && record.sourceSubmissionId && (
        <Link
          className="issue-detail-source-link"
          to={`/admin/submissions/${record.sourceSubmissionId}`}
          onClick={(event) => {
            if (onNavigate && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
              event.preventDefault();
              onNavigate(`/admin/submissions/${record.sourceSubmissionId}`);
            }
          }}
        >원본 체크리스트 보기 <span aria-hidden="true">→</span></Link>
      )}
    </section>
  );
}
