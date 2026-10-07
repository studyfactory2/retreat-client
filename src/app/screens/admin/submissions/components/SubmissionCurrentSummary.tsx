import type { AdminSubmissionDetail } from '../../../../features/admin-submissions/admin-submissions.types';
import {
  submissionActionLabel,
  submissionRoleLabel,
  submissionSourceLabel,
  submissionTime,
  submissionTypeLabel,
} from '../model/submission-detail-model';

export function SubmissionCurrentSummary({
  detail,
}: {
  detail: AdminSubmissionDetail;
}) {
  const { revision } = detail;
  const record = revision.record;
  return (
    <section
      className="submission-detail-card submission-current-summary"
      aria-labelledby="submission-current-heading"
    >
      <div className="submission-detail-section-heading">
        <div>
          <p className="submission-detail-eyebrow">
            현재 저장된 내용 · 버전 {detail.currentRevision}
          </p>
          <h2 id="submission-current-heading">{record.property.name}</h2>
          {record.property.region && (
            <p className="submission-detail-caption">
              {record.property.region}
            </p>
          )}
        </div>
        <div className="submission-summary-badges">
          <span className="submission-detail-badge">
            {submissionTypeLabel(record.type)}
          </span>
          <span
            className={`submission-detail-badge${detail.status === 'CANCELLED' ? ' submission-detail-badge--danger' : ''}`}
          >
            {detail.status === 'CANCELLED' ? '취소됨' : '제출됨'}
          </span>
        </div>
      </div>
      <dl className="submission-summary-facts">
        <div>
          <dt>최초 작성자</dt>
          <dd>
            {record.author.name} · {submissionRoleLabel(record.author.role)}
          </dd>
        </div>
        <div>
          <dt>최초 제출</dt>
          <dd>{submissionTime(record.submittedAt)}</dd>
        </div>
        <div>
          <dt>방문일</dt>
          <dd>{record.visitDate}</dd>
        </div>
      </dl>
      <div className="submission-current-change">
        <p>
          <strong>최근 기록 · {submissionActionLabel(revision.action)}</strong>{' '}
          · {submissionTime(revision.createdAt)} · {revision.actor.name} (
          {submissionRoleLabel(revision.actor.role)} /{' '}
          {submissionSourceLabel(revision.actorSource)})
        </p>
        {revision.reason && (
          <p className="submission-detail-text">
            <strong>사유: </strong>
            {revision.reason}
          </p>
        )}
        {detail.currentRevision > 1 && (
          <p className="submission-detail-caption">
            최초 제출 이후 변경된 기록입니다. 버전별 내용과 사진은 아래 제출
            이력에서 확인할 수 있습니다.
          </p>
        )}
      </div>
      {detail.status === 'CANCELLED' && (
        <p className="submission-detail-notice submission-current-cancelled">
          취소된 제출 기록입니다. 저장된 답변·사진·이력은 보존되며, 복원하면
          현재 저장된 내용이 유지됩니다.
        </p>
      )}
    </section>
  );
}
