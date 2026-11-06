import type { CleaningTaskDto } from '../../../../features/cleaning-tasks/cleaning-tasks.types';
import { Button } from '../../../../shared/ui/Button/Button';
import {
  agendaDateTime,
  staffTaskName,
  staffTaskStatus,
} from '../model/staff-task-agenda';

export function StaffTaskDetail({
  task,
  detailId,
  wide,
  assignedName,
  confirmed,
  pending,
  startError,
  onRefresh,
  onConfirm,
  onStart,
}: {
  task: CleaningTaskDto;
  detailId: string;
  wide: boolean;
  assignedName: string;
  confirmed: boolean;
  pending: boolean;
  startError: string | null;
  onRefresh: () => void;
  onConfirm: (checked: boolean) => void;
  onStart: () => void;
}) {
  const active = task.status === 'PLANNED' || task.status === 'IN_PROGRESS';
  return (
    <section
      className="staff-task-detail"
      id={detailId}
      aria-label={staffTaskName(task) + ' 상세'}
    >
      {wide && (
        <header>
          <h3>{staffTaskName(task)}</h3>
          <span className={`staff-task-badge is-${task.status.toLowerCase()}`}>
            {staffTaskStatus(task)}
          </span>
        </header>
      )}
      <dl className="staff-task-facts">
        {(wide || !active) && (
          <div>
            <dt>작업 예정</dt>
            <dd>
              <time dateTime={task.dueAt}>{agendaDateTime(task.dueAt)}</time>
            </dd>
          </div>
        )}
        {task.departingStay && (
          <div>
            <dt>퇴실 예정</dt>
            <dd>
              <time dateTime={task.departingStay.checkOutAt}>
                {agendaDateTime(task.departingStay.checkOutAt)}
              </time>
            </dd>
          </div>
        )}
        {task.completedAt && (
          <div>
            <dt>완료 시각</dt>
            <dd>
              <time dateTime={task.completedAt}>
                {agendaDateTime(task.completedAt)}
              </time>
            </dd>
          </div>
        )}
        {task.note && (
          <div>
            <dt>작업 메모</dt>
            <dd>{task.note}</dd>
          </div>
        )}
      </dl>
      {active &&
        (task.canStart ? (
          <>
            <label className="staff-task-confirm">
              <input
                type="checkbox"
                checked={confirmed}
                disabled={pending}
                onChange={(event) => onConfirm(event.target.checked)}
              />
              <span>
                담당 직원 <strong>{assignedName}</strong>입니다.
              </span>
            </label>
            <Button
              loading={pending}
              disabled={!confirmed || pending}
              onClick={onStart}
            >
              {task.currentSubmissionId ? '이어서 작성' : '작업 시작'}
            </Button>
          </>
        ) : (
          <p className="staff-task-attention">
            {task.requiresReview
              ? '일정과 담당 직원을 관리자에게 확인해 주세요.'
              : '퇴실 예정 시각 이후에 시작할 수 있어요.'}
          </p>
        ))}
      {startError && (
        <div className="staff-task-message" role="alert">
          <p>{startError}</p>
          <button type="button" onClick={onRefresh}>
            목록 다시 확인
          </button>
        </div>
      )}
    </section>
  );
}
