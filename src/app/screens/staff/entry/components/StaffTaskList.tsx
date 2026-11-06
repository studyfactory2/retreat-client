import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { startCleaningTask } from '../../../../features/cleaning-tasks/cleaning-tasks-api';
import type {
  CleaningTaskDto,
  CleaningTaskListDto,
} from '../../../../features/cleaning-tasks/cleaning-tasks.types';
import type { StaffQrContextDto } from '../../../../features/staff-entry/staff-entry.types';
import { useOpenStaffDraft } from '../hooks/use-open-staff-draft';
import {
  agendaTime,
  groupStaffTasks,
  staffTaskName,
  staffTaskStatus,
} from '../model/staff-task-agenda';
import { loadStaffTaskPage } from '../model/load-staff-task-page';
import { StaffIcon } from './StaffIcon';
import { StaffTaskDetail } from './StaffTaskDetail';
import '../styles/staff-tasks.css';

export type StaffTaskView = { showCompleted: boolean; page: number };

const wideQuery = '(min-width: 800px)';

export function StaffTaskList({
  token,
  context,
  rejectAccess,
  view,
  onViewChange,
  onRefreshContext,
}: {
  token: string;
  context: StaffQrContextDto;
  rejectAccess: () => void;
  view: StaffTaskView;
  onViewChange: (view: StaffTaskView) => void;
  onRefreshContext: () => void;
}) {
  const { showCompleted, page } = view;
  const detailId = useId();
  const openDraft = useOpenStaffDraft();
  const [wide, setWide] = useState(() => window.matchMedia(wideQuery).matches);
  const [list, setList] = useState<CleaningTaskListDto | null>(null);
  const [syncDeferred, setSyncDeferred] = useState(false);
  const [loadedFor, setLoadedFor] = useState('');
  const [message, setMessage] = useState('');
  const [startError, setStartError] = useState<{
    taskId: string;
    message: string;
  } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmedFor, setConfirmedFor] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const operation = useRef<AbortController | null>(null);
  const callbacks = useRef({ rejectAccess, onViewChange });
  const owner = `${token}:${context.property.id}:${context.assignedStaff?.id}:${showCompleted}:${page}`;
  const loading = loadedFor !== owner;

  useLayoutEffect(() => {
    callbacks.current = { rejectAccess, onViewChange };
  }, [rejectAccess, onViewChange]);

  useLayoutEffect(() => () => operation.current?.abort(), [owner]);

  useEffect(() => {
    const media = window.matchMedia(wideQuery);
    const update = () => setWide(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadStaffTaskPage(
      token,
      context.property.id,
      page,
      showCompleted,
      controller.signal,
    ).then(
      ({ list: result, syncDeferred }) => {
        if (controller.signal.aborted) return;
        const lastPage = Math.max(1, result.totalPages);
        if (page > lastPage) {
          callbacks.current.onViewChange({ showCompleted, page: lastPage });
          return;
        }
        setList(result);
        setSyncDeferred(syncDeferred);
        setLoadedFor(owner);
        setMessage('');
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        if (
          error instanceof ApiRequestError &&
          [401, 403].includes(error.status ?? 0)
        ) {
          callbacks.current.rejectAccess();
        }
        setList(null);
        setLoadedFor(owner);
        setMessage(
          error instanceof ApiRequestError && error.status === 429
            ? '작업 목록 요청이 많아요. 1분 뒤 다시 확인해 주세요.'
            : error instanceof Error
              ? error.message
              : '작업 목록을 불러오지 못했습니다.',
        );
      },
    );
    return () => controller.abort();
  }, [token, owner, context.property.id, page, showCompleted]);

  const tasks =
    !loading && list
      ? list.items.filter((task) =>
          showCompleted
            ? task.status === 'COMPLETED' || task.status === 'CANCELLED'
            : task.status === 'PLANNED' || task.status === 'IN_PROGRESS',
        )
      : [];
  const groups = groupStaffTasks(tasks);
  const current =
    tasks.find((task) => task.id === selected) ?? (wide ? tasks[0] : undefined);
  const confirmationKey = current
    ? `${owner}:${current.id}:${current.version}`
    : '';
  const confirmed = !!confirmationKey && confirmedFor === confirmationKey;

  async function start(task: CleaningTaskDto) {
    if (
      operation.current ||
      !confirmed ||
      current?.id !== task.id ||
      !context.assignedStaff ||
      !task.canStart
    )
      return;
    const controller = new AbortController();
    operation.current = controller;
    setPending(task.id);
    setStartError(null);
    try {
      const result = await startCleaningTask(
        token,
        task.id,
        context.property.id,
        context.assignedStaff.id,
        task.version,
        controller.signal,
      );
      if (!controller.signal.aborted) openDraft(result, token);
    } catch (error: unknown) {
      if (controller.signal.aborted) return;
      if (
        error instanceof ApiRequestError &&
        [401, 403].includes(error.status ?? 0)
      ) {
        callbacks.current.rejectAccess();
      }
      setStartError({
        taskId: task.id,
        message:
          error instanceof ApiRequestError && error.status && error.status < 500
            ? error.message
            : '작업을 열지 못했어요. 목록을 새로고침한 뒤 같은 작업을 다시 선택해 주세요.',
      });
    } finally {
      if (operation.current === controller) {
        operation.current = null;
        setPending(null);
      }
    }
  }

  function changeView(next: StaffTaskView) {
    if (next.showCompleted === showCompleted && next.page === page) return;
    setSelected(null);
    setConfirmedFor('');
    setLoadedFor('');
    setMessage('');
    setStartError(null);
    onViewChange(next);
  }

  const detail = current && (
    <StaffTaskDetail
      key={current.id}
      task={current}
      detailId={detailId}
      wide={wide}
      assignedName={context.assignedStaff?.name ?? ''}
      confirmed={confirmed}
      startError={startError?.taskId === current.id ? startError.message : null}
      onRefresh={onRefreshContext}
      pending={pending !== null}
      onConfirm={(value) => setConfirmedFor(value ? confirmationKey : '')}
      onStart={() => void start(current)}
    />
  );

  return (
    <section className="staff-task-card" aria-labelledby="staff-tasks-heading">
      <header className="staff-task-heading">
        <h2 id="staff-tasks-heading">정비 작업</h2>
        <button
          type="button"
          disabled={loading || pending !== null}
          aria-label="작업 목록 새로고침"
          onClick={onRefreshContext}
        >
          <StaffIcon name="refresh" />
        </button>
      </header>
      <div className="staff-task-tabs" role="group" aria-label="작업 상태">
        {[false, true].map((completed) => (
          <button
            key={String(completed)}
            type="button"
            disabled={pending !== null}
            aria-pressed={showCompleted === completed}
            onClick={() => changeView({ showCompleted: completed, page: 1 })}
          >
            {completed ? '완료' : '할 일'}
            {showCompleted === completed && !loading && list && (
              <span className="staff-task-total" aria-label={list.total + '건'}>
                {list.total}
              </span>
            )}
          </button>
        ))}
      </div>
      {loading && (
        <p className="staff-task-empty" role="status">
          작업을 확인하고 있어요.
        </p>
      )}
      {!loading && list && syncDeferred && (
        <p className="staff-task-sync-note" role="status">
          저장된 작업을 표시합니다. 최신 일정 동기화는 잠시 후 다시 시도해
          주세요.
        </p>
      )}
      {!loading && list && !tasks.length && (
        <p className="staff-task-empty" role="status">
          {showCompleted
            ? '완료된 작업이 없습니다.'
            : '예정된 작업이 없습니다.'}
        </p>
      )}
      {tasks.length > 0 && (
        <div className="staff-task-workspace">
          <div className="staff-task-agenda">
            {groups.map((group) => (
              <section className="staff-task-group" key={group.date}>
                <h3 className="staff-task-group-label">
                  {group.relative && <strong>{group.relative}</strong>}
                  <time dateTime={group.date}>{group.label}</time>
                </h3>
                <ul className="staff-task-list">
                  {group.tasks.map((task) => {
                    const isSelected = current?.id === task.id;
                    return (
                      <li
                        key={task.id}
                        className={isSelected ? 'is-selected' : ''}
                      >
                        <button
                          className="staff-task-row"
                          type="button"
                          disabled={pending !== null}
                          aria-expanded={isSelected}
                          aria-controls={isSelected ? detailId : undefined}
                          onClick={() => {
                            if (wide && isSelected) return;
                            setSelected(isSelected ? null : task.id);
                            setConfirmedFor('');
                            setStartError(null);
                          }}
                        >
                          <time dateTime={task.dueAt}>
                            {agendaTime(task.dueAt)}
                          </time>
                          <span className="staff-task-row-main">
                            <strong>{staffTaskName(task)}</strong>
                            {task.requiresReview && (
                              <small className="staff-task-attention">
                                관리자 확인 필요
                              </small>
                            )}
                          </span>
                          <span
                            className={`staff-task-badge is-${task.status.toLowerCase()}`}
                          >
                            {staffTaskStatus(task)}
                          </span>
                          <StaffIcon name="chevron" />
                        </button>
                        {isSelected && !wide && detail}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
          {wide && detail}
        </div>
      )}
      {!loading && list && list.totalPages > 1 && (
        <nav className="staff-task-pagination" aria-label="직원 작업 페이지">
          <button
            type="button"
            disabled={pending !== null || page <= 1}
            onClick={() => changeView({ showCompleted, page: page - 1 })}
          >
            이전
          </button>
          <span>
            {page} / {list.totalPages}
          </span>
          <button
            type="button"
            disabled={pending !== null || page >= list.totalPages}
            onClick={() => changeView({ showCompleted, page: page + 1 })}
          >
            다음
          </button>
        </nav>
      )}
      {!loading && message && (
        <div className="staff-task-message" role="alert">
          <p>{message}</p>
          <button
            type="button"
            disabled={pending !== null}
            onClick={onRefreshContext}
          >
            목록 다시 확인
          </button>
        </div>
      )}
    </section>
  );
}
