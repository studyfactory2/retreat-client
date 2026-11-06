import type { StaffCompletionDto } from '../../../../features/cleaning-tasks/cleaning-tasks.types';
import {
  agendaDateTime,
  agendaTime,
  groupStaffAgenda,
  staffTaskName,
} from '../model/staff-task-agenda';
import { StaffIcon } from './StaffIcon';

export function StaffCompletionList({
  entries,
}: {
  entries: StaffCompletionDto[];
}) {
  const groups = groupStaffAgenda(entries, (entry) => entry.completedAt);
  return groups.map((group) => (
    <section className="staff-task-group" key={group.date}>
      <h3 className="staff-task-group-label">
        {group.relative && <strong>{group.relative}</strong>}
        <time dateTime={group.date}>{group.label}</time>
      </h3>
      <ul className="staff-task-list">
        {group.tasks.map((entry) => {
          const { schedule } = entry;
          const summary = (
            <>
              <span className="staff-completion-title">
                <strong>{staffTaskName(entry)}</strong>
                {entry.source === 'STANDALONE' && (
                  <span className="staff-task-badge">일정 외</span>
                )}
                {entry.requiresReview && (
                  <span className="staff-task-attention">관리자 확인 필요</span>
                )}
              </span>
              <time dateTime={entry.completedAt}>
                {agendaTime(entry.completedAt)} 제출
              </time>
            </>
          );
          return (
            <li key={entry.id}>
              {schedule ? (
                <details className="staff-completion-detail">
                  <summary className="staff-completion-row">
                    {summary}
                    <StaffIcon name="chevron" />
                  </summary>
                  <dl className="staff-task-facts">
                    <div>
                      <dt>작업 예정</dt>
                      <dd>
                        <time dateTime={schedule.dueAt}>
                          {agendaDateTime(schedule.dueAt)}
                        </time>
                      </dd>
                    </div>
                    {schedule.checkOutAt && (
                      <div>
                        <dt>퇴실 예정</dt>
                        <dd>
                          <time dateTime={schedule.checkOutAt}>
                            {agendaDateTime(schedule.checkOutAt)}
                          </time>
                        </dd>
                      </div>
                    )}
                    {schedule.note && (
                      <div>
                        <dt>작업 메모</dt>
                        <dd>{schedule.note}</dd>
                      </div>
                    )}
                  </dl>
                </details>
              ) : (
                <div className="staff-completion-row">{summary}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  ));
}
