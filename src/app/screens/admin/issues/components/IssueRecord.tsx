import { Link } from 'react-router-dom';
import type { AdminIssueRecordDto } from '../../../../features/admin-issues/admin-issues.types';
import {
  issueChecklistLabel,
  issueStatusLabel,
  issueStatusTone,
  issueTime,
} from '../model/issue-presentation';

export function IssueRecord({
  record,
  title = '저장된 신고 내용',
  showSourceLink = false,
}: {
  record: AdminIssueRecordDto;
  title?: string;
  showSourceLink?: boolean;
}) {
  return (
    <section className="issue-detail-card issue-record">
      <div className="issue-detail-section-heading">
        <h3>{title}</h3>
        <div className="issue-detail-badges">
          <span
            className={`issue-detail-badge issue-detail-badge--${issueStatusTone(record.status)}`}
          >
            {issueStatusLabel(record.status)}
          </span>
          {record.isUrgent && (
            <span className="issue-detail-badge issue-detail-badge--danger">
              긴급
            </span>
          )}
          {record.cancelledAt && (
            <span className="issue-detail-badge issue-detail-badge--muted">
              취소됨
            </span>
          )}
        </div>
      </div>
      <p className="issue-record-title">{record.title}</p>
      <p className="issue-detail-text">
        {record.description || '작성된 상세 내용이 없습니다.'}
      </p>
      <dl className="issue-detail-grid">
        <div>
          <dt>휴양소</dt>
          <dd>
            {record.property.name}
            {record.property.region && (
              <span className="issue-detail-muted">
                {' '}
                · {record.property.region}
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt>신고 분류</dt>
          <dd>{record.category.name}</dd>
        </div>
        <div>
          <dt>신고 위치</dt>
          <dd>{record.areaLabel || '위치 미입력'}</dd>
        </div>
        <div>
          <dt>접수 일시</dt>
          <dd>{issueTime(record.reportedAt)}</dd>
        </div>
        <div>
          <dt>마지막 변경</dt>
          <dd>{issueTime(record.updatedAt)}</dd>
        </div>
        <div>
          <dt>해결 일시</dt>
          <dd>
            {record.resolvedAt
              ? issueTime(record.resolvedAt)
              : '해결 기록 없음'}
          </dd>
        </div>
        <div className="issue-detail-grid__wide">
          <dt>신고 경로</dt>
          <dd>
            {record.source ? (
              <>
                {issueChecklistLabel(record.source.checklistType)} ·{' '}
                {record.source.templateTitle}
                <span className="issue-detail-muted">
                  {' '}
                  · 양식 버전 {record.source.templateVersion}
                </span>
              </>
            ) : (
              '별도 불편사항 신고'
            )}
          </dd>
        </div>
      </dl>
      {record.cancelledAt && (
        <div className="issue-detail-notice">
          <strong>취소된 기록 · {issueTime(record.cancelledAt)}</strong>
          <p className="issue-detail-text">
            {record.cancellationReason || '작성된 취소 사유 없음'}
          </p>
        </div>
      )}
      {showSourceLink && record.sourceSubmissionId && (
        <Link
          className="issue-detail-source-link"
          to={`/admin/submissions/${record.sourceSubmissionId}`}
        >
          원본 체크리스트 보기 <span aria-hidden="true">→</span>
        </Link>
      )}
    </section>
  );
}
