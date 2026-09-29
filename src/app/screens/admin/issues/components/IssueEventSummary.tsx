import type { AdminIssueEventDto } from '../../../../features/admin-issues/admin-issues.types';
import {
  issueActorRoleLabel,
  issueActorSourceLabel,
  issueEventLabel,
  issueEventTransition,
  issueTime,
} from '../model/issue-presentation';

export function IssueEventSummary({ event }: { event: AdminIssueEventDto }) {
  return (
    <div className="issue-event-summary">
      <h3>{issueEventLabel(event.type)}</h3>
      <p className="issue-detail-caption">
        {event.actor.name} · {issueActorRoleLabel(event.actor.role)} ·{' '}
        {issueActorSourceLabel(event.actorSource)}
      </p>
      <p className="issue-detail-caption">{issueTime(event.createdAt)}</p>
      {issueEventTransition(event) && (
        <p className="issue-detail-transition">{issueEventTransition(event)}</p>
      )}
      {event.type === 'REPAIR_REPORTED' && (
        <p className="issue-detail-notice">
          직원이 남긴 조치 보고입니다. 관리자 해결 처리와 구분해 확인하세요.
        </p>
      )}
      {event.note && (
        <p className="issue-detail-text">
          <strong>메모: </strong>
          {event.note}
        </p>
      )}
    </div>
  );
}
