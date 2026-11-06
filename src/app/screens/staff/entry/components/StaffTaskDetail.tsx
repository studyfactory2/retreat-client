import type { CleaningTaskDto } from '../../../../features/cleaning-tasks/cleaning-tasks.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { agendaDateTime, staffTaskName } from '../model/staff-task-agenda';

export function StaffTaskDetail({
  task,
  detailId,
  wide,
  assignedName,
  confirmed,
  pending,
  onConfirm,
  onStart,
}: {
  task: CleaningTaskDto;
  detailId: string;
  wide: boolean;
  assignedName: string;
  confirmed: boolean;
  pending: boolean;
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
      {wide && <h3>{staffTaskName(task)}</h3>}
      {(wide || !active) && <p>작업 예정 · {agendaDateTime(task.dueAt)}</p>}
      {task.note && <p className="staff-task-note">{task.note}</p>}
      {task.departingStay && (
        <p>퇴실 예정 · {agendaDateTime(task.departingStay.checkOutAt)}</p>
      )}
      {task.completedAt && <p>완료 · {agendaDateTime(task.completedAt)}</p>}
      {active &&
        (task.canStart ? (
          <>
            <label className="staff-task-confirm">
              <input
                type="checkbox"
                checked={confirmed}
                disabled={pending}
                onChange={(e) => onConfirm(e.target.checked)}
              />
              <span>
                담당 직원 <strong>{assignedName}</strong> 확인
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
              ? '일정과 담당 직원 상태를 관리자에게 확인해 주세요.'
              : '퇴실 예정 시각 이후 시작할 수 있어요.'}
          </p>
        ))}
    </section>
  );
}
