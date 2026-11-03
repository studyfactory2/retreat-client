import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import {
  getStaffCleaningTasks,
  startCleaningTask,
} from '../../../../features/cleaning-tasks/cleaning-tasks-api';
import type {
  CleaningTaskDto,
  CleaningTaskListDto,
} from '../../../../features/cleaning-tasks/cleaning-tasks.types';
import {
  taskStatusLabel,
  taskTime,
} from '../../../../features/cleaning-tasks/cleaning-tasks-display';
import type { StaffQrContextDto } from '../../../../features/staff-entry/staff-entry.types';
import { Button } from '../../../../shared/ui/Button/Button';
import '../styles/staff-tasks.css';

export function StaffTaskList({
  token,
  context,
  rejectAccess,
}: {
  token: string;
  context: StaffQrContextDto;
  rejectAccess: () => void;
}) {
  const [revision, setRevision] = useState(0);
  const [list, setList] = useState<CleaningTaskListDto | null>(null);
  const [loadedFor, setLoadedFor] = useState('');
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmedFor, setConfirmedFor] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [page, setPage] = useState(1);
  const operation = useRef<AbortController | null>(null);
  const callbacks = useRef({ rejectAccess });
  const owner = `${token}:${context.property.id}:${context.assignedStaff?.id}:${revision}:${showCompleted}:${page}`;
  const loading = loadedFor !== owner;
  const confirmed = confirmedFor === owner;
  const setConfirmed = (value: boolean) => setConfirmedFor(value ? owner : '');
  useLayoutEffect(() => {
    callbacks.current = { rejectAccess };
  }, [rejectAccess]);
  useEffect(() => {
    const controller = new AbortController();

    void getStaffCleaningTasks(
      token,
      !showCompleted,
      controller.signal,
      page,
      showCompleted,
    ).then(
      (result) => {
        if (!controller.signal.aborted) {
          setList(result);
          setLoadedFor(owner);
        }
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        if (
          error instanceof ApiRequestError &&
          [401, 403].includes(error.status ?? 0)
        )
          callbacks.current.rejectAccess();
        setLoadedFor(owner);
        setMessage(
          error instanceof Error
            ? error.message
            : '작업 목록을 불러오지 못했습니다.',
        );
      },
    );
    return () => controller.abort();
  }, [
    token,
    context.property.id,
    context.assignedStaff?.id,
    revision,
    page,
    showCompleted,
    owner,
  ]);
  useEffect(
    () => () => {
      operation.current?.abort();
    },
    [],
  );

  async function start(task: CleaningTaskDto) {
    if (
      operation.current ||
      !confirmed ||
      !context.assignedStaff ||
      !task.canStart
    )
      return;
    const controller = new AbortController();
    operation.current = controller;
    setPending(task.id);
    setMessage('');
    try {
      const result = await startCleaningTask(
        token,
        task.id,
        context.property.id,
        context.assignedStaff.id,
        task.version,
        controller.signal,
      );
      if (!controller.signal.aborted) window.location.assign(result.url);
    } catch (error: unknown) {
      if (controller.signal.aborted) return;
      if (
        error instanceof ApiRequestError &&
        [401, 403].includes(error.status ?? 0)
      )
        callbacks.current.rejectAccess();
      setMessage(
        error instanceof ApiRequestError && error.status && error.status < 500
          ? error.message
          : '작성 화면을 열지 못했습니다. 목록을 새로고침한 뒤 같은 작업에서 이어쓰기를 눌러 주세요.',
      );
    } finally {
      if (operation.current === controller) {
        operation.current = null;
        setPending(null);
      }
    }
  }
  const tasks =
    list?.items.filter((t) =>
      showCompleted
        ? t.status === 'COMPLETED' || t.status === 'CANCELLED'
        : t.status === 'PLANNED' || t.status === 'IN_PROGRESS',
    ) ?? [];
  return (
    <section className="staff-task-card" aria-labelledby="staff-tasks-heading">
      <header className="staff-task-heading">
        <div>
          <h2 id="staff-tasks-heading">정비 작업</h2>
        </div>
        <button
          type="button"
          disabled={loading || pending !== null}
          aria-label="작업 목록 새로고침"
          onClick={() => setRevision((v) => v + 1)}
        >
          ↻
        </button>
      </header>
      <div className="staff-task-tabs" aria-label="작업 상태">
        <button
          type="button"
          disabled={pending !== null}
          aria-pressed={!showCompleted}
          onClick={() => {
            setShowCompleted(false);
            setPage(1);
            setSelected(null);
          }}
        >
          할 일
        </button>
        <button
          type="button"
          disabled={pending !== null}
          aria-pressed={showCompleted}
          onClick={() => {
            setShowCompleted(true);
            setPage(1);
            setSelected(null);
          }}
        >
          완료
        </button>
      </div>
      {loading ? (
        <p className="staff-task-empty" role="status">
          작업을 확인하고 있어요.
        </p>
      ) : tasks.length === 0 ? (
        <p className="staff-task-empty">
          {showCompleted
            ? '완료된 작업이 없습니다.'
            : '예정된 작업이 없습니다.'}
        </p>
      ) : (
        <ul className="staff-task-list">
          {tasks.map((task) => (
            <li
              key={task.id}
              className={selected === task.id ? 'is-selected' : ''}
            >
              <button
                className="staff-task-row"
                type="button"
                disabled={pending !== null}
                aria-expanded={selected === task.id}
                onClick={() => {
                  setSelected(selected === task.id ? null : task.id);
                  setConfirmed(false);
                }}
              >
                <span className="staff-task-date">
                  <strong>
                    {new Intl.DateTimeFormat('ko-KR', {
                      timeZone: 'Asia/Seoul',
                      day: 'numeric',
                    }).format(new Date(task.dueAt))}
                  </strong>
                  <small>
                    {new Intl.DateTimeFormat('ko-KR', {
                      timeZone: 'Asia/Seoul',
                      month: 'numeric',
                    }).format(new Date(task.dueAt))}
                  </small>
                </span>
                <span className="staff-task-row-main">
                  <strong>
                    {task.source === 'AUTO' ? '퇴실 후 청소·정비' : '추가 정비'}
                  </strong>
                  <span>{taskTime(task.dueAt)}</span>
                  {task.requiresReview && (
                    <small className="staff-task-attention">
                      관리자 확인 필요
                    </small>
                  )}
                </span>
                <span
                  className={`staff-task-badge is-${task.status.toLowerCase()}`}
                >
                  {taskStatusLabel[task.status]}
                </span>
                <span aria-hidden="true">
                  {selected === task.id ? '⌃' : '›'}
                </span>
              </button>
              {selected === task.id && (
                <div className="staff-task-detail">
                  {task.note && <p>{task.note}</p>}
                  {task.departingStay && (
                    <p>퇴실 예정 · {taskTime(task.departingStay.checkOutAt)}</p>
                  )}
                  {task.completedAt && (
                    <p>완료 · {taskTime(task.completedAt)}</p>
                  )}
                  {task.status !== 'COMPLETED' &&
                    task.status !== 'CANCELLED' && (
                      <>
                        {task.canStart ? (
                          <>
                            <label className="staff-task-confirm">
                              <input
                                type="checkbox"
                                checked={confirmed}
                                disabled={pending !== null}
                                onChange={(e) => setConfirmed(e.target.checked)}
                              />
                              <span>
                                담당 직원{' '}
                                <strong>{context.assignedStaff?.name}</strong>{' '}
                                확인
                              </span>
                            </label>
                            <Button
                              loading={pending === task.id}
                              disabled={!confirmed || pending !== null}
                              onClick={() => void start(task)}
                            >
                              {task.currentSubmissionId
                                ? '이어서 작성'
                                : '작업 시작'}
                            </Button>
                          </>
                        ) : (
                          <p className="staff-task-attention">
                            {task.requiresReview
                              ? '일정과 담당 직원 상태를 관리자에게 확인해 주세요.'
                              : '퇴실 예정 시각 이후 시작할 수 있어요.'}
                          </p>
                        )}
                      </>
                    )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {list && list.totalPages > 1 && (
        <nav className="staff-task-pagination" aria-label="직원 작업 페이지">
          <button
            type="button"
            disabled={loading || pending !== null || page <= 1}
            onClick={() => setPage((v) => v - 1)}
          >
            이전
          </button>
          <span>
            {page} / {list.totalPages}
          </span>
          <button
            type="button"
            disabled={loading || pending !== null || page >= list.totalPages}
            onClick={() => setPage((v) => v + 1)}
          >
            다음
          </button>
        </nav>
      )}
      {message && (
        <div className="staff-task-message" role="alert">
          <p>{message}</p>
          <button
            type="button"
            disabled={loading || pending !== null}
            onClick={() => setRevision((v) => v + 1)}
          >
            목록 다시 확인
          </button>
        </div>
      )}
      <p className="staff-task-footnote">
        이 QR에서 작성 중인 작업을 다시 열 수 있어요.
      </p>
    </section>
  );
}
