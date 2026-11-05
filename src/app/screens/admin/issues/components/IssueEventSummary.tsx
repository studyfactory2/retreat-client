import type { ReactNode } from 'react';
import type { AdminIssueEventDto } from '../../../../features/admin-issues/admin-issues.types';
import {
  issueActorRoleLabel,
  issueActorSourceLabel,
  issueEventLabel,
  issueEventTransition,
  issueListTime,
  issueTime,
} from '../model/issue-presentation';
import '../styles/issue-history.css';

export function IssueEventSummary({
  event,
  action,
}: {
  event: AdminIssueEventDto;
  action?: ReactNode;
}) {
  const transition = issueEventTransition(event);
  return (
    <div className="issue-history-event">
      <div className="issue-history-event__heading">
        <div className="issue-history-event__description">
          <div className="issue-history-event__title">
            <h3>{issueEventLabel(event.type)}</h3>
            <span className="issue-history-version">버전 {event.version}</span>
          </div>
          <IssueEventIdentity event={event} compact />
        </div>
        {action}
      </div>
      {transition && (
        <p className="issue-history-event__transition">{transition}</p>
      )}
      {event.type === 'REPAIR_REPORTED' && (
        <p className="issue-history-event__notice">
          직원 조치 보고 · 관리자 해결 처리와 별개
        </p>
      )}
      {event.note && <p className="issue-history-note">{event.note}</p>}
    </div>
  );
}

export function IssueEventIdentity({
  event,
  compact = false,
}: {
  event: AdminIssueEventDto;
  compact?: boolean;
}) {
  const role = issueActorRoleLabel(event.actor.role);
  const source = issueActorSourceLabel(event.actorSource);
  return (
    <p className="issue-history-identity">
      <span>
        <strong>{event.actor.name}</strong> · {role}
        {!compact && source !== role && <> · {source}</>}
      </span>
      <time dateTime={event.createdAt}>
        {compact ? issueListTime(event.createdAt) : issueTime(event.createdAt)}
      </time>
    </p>
  );
}
