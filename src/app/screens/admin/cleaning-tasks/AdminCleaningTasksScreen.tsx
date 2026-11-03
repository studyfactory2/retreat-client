import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiRequestError } from '../../../core/api/api-error';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { useNavigationGuard } from '../../../core/router/navigation/use-navigation-guard';
import { useAdminPropertyOptions } from '../../../features/admin-properties/use-admin-property-options';
import {
  cancelCleaningTask,
  createCleaningTask,
  getAdminCleaningTasks,
  syncAdminCleaningTasks,
  updateCleaningTask,
} from '../../../features/cleaning-tasks/cleaning-tasks-api';
import type {
  CleaningTaskDto,
  CleaningTaskListDto,
  CleaningTaskStatus,
} from '../../../features/cleaning-tasks/cleaning-tasks.types';
import {
  taskStatusLabel,
  taskTime,
} from '../../../features/cleaning-tasks/cleaning-tasks-display';
import { AdminBackButton } from '../components/AdminBackButton';
import { Button } from '../../../shared/ui/Button/Button';
import { CleaningTaskEditor } from './components/CleaningTaskEditor';
import '../styles/admin-directory.css';
import './styles/cleaning-tasks.css';

export function AdminCleaningTasksScreen() {
  const { state, rejectSession } = useAdminSession();
  if (state.status !== 'authenticated') return null;
  return (
    <CleaningTasksWorkspace
      key={`${state.user.id}:${state.expiresAt}`}
      token={state.token}
      rejectSession={rejectSession}
    />
  );
}
function CleaningTasksWorkspace({
  token,
  rejectSession,
}: {
  token: string;
  rejectSession: (token: string) => void;
}) {
  const properties = useAdminPropertyOptions(token, rejectSession);
  const [propertyId, setPropertyId] = useState('');
  const [status, setStatus] = useState<CleaningTaskStatus | ''>('');
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [list, setList] = useState<CleaningTaskListDto | null>(null);
  const [loadedFor, setLoadedFor] = useState('');
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState<CleaningTaskDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const mutation = useRef(false);
  const alive = useRef(false);
  const owner = `${token}:${propertyId}:${status}:${page}:${revision}`;
  const loading = loadedFor !== owner;
  useNavigationGuard(() => mutation.current);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void getAdminCleaningTasks(
      token,
      {
        propertyId: propertyId || undefined,
        status: status || undefined,
        page,
      },
      controller.signal,
    ).then(
      (data) => {
        if (controller.signal.aborted) return;
        setList(data);
        setLoadedFor(owner);
        setUncertain(false);
        setSelected((previous) =>
          previous
            ? (data.items.find((item) => item.id === previous.id) ?? null)
            : null,
        );
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        if (
          error instanceof ApiRequestError &&
          [401, 403].includes(error.status ?? 0)
        )
          rejectSession(token);
        setLoadedFor(owner);
        setMessage(
          error instanceof Error
            ? error.message
            : '작업 목록을 불러오지 못했습니다.',
        );
      },
    );
    return () => controller.abort();
  }, [token, rejectSession, propertyId, status, page, revision, owner]);
  async function run(action: () => Promise<unknown>, success: string) {
    if (mutation.current) return;
    mutation.current = true;
    setPending(true);
    setMessage('');
    try {
      await action();
      if (!alive.current) return;
      setMessage(success);
      setCreating(false);
      setSelected(null);
      setRevision((v) => v + 1);
    } catch (error: unknown) {
      if (!alive.current) return;
      if (
        error instanceof ApiRequestError &&
        [401, 403].includes(error.status ?? 0)
      )
        rejectSession(token);
      const unknown =
        !(error instanceof ApiRequestError) ||
        error.status === null ||
        error.status >= 500 ||
        error.status === 408 ||
        error.status < 400;
      setUncertain(unknown);
      setMessage(
        unknown
          ? '처리 결과를 확인하지 못했습니다. 중복 등록을 피하려면 먼저 목록을 새로고침해 주세요.'
          : error.message,
      );
      if (error instanceof ApiRequestError && error.status === 409)
        setRevision((v) => v + 1);
    } finally {
      mutation.current = false;
      if (alive.current) setPending(false);
    }
  }
  const refresh = () => {
    setMessage('');
    setRevision((v) => v + 1);
    properties.refresh();
  };
  const detailOpen = creating || selected !== null;
  return (
    <div className="admin-directory admin-cleaning-tasks">
      <header className="cleaning-tasks-heading">
        <div className="admin-page-heading-title">
          <AdminBackButton fallback="/admin/maintenance" />
          <div>
            <h1>정비 작업</h1>
            <p>퇴실 일정에 맞춰 준비하고 완료를 확인하세요.</p>
          </div>
        </div>
        <Button
          disabled={pending}
          onClick={() => {
            setCreating(true);
            setSelected(null);
          }}
        >
          ＋ 작업 등록
        </Button>
      </header>
      <nav className="cleaning-tasks-nav" aria-label="청소·정비 화면">
        <span aria-current="page">정비 작업</span>
        <Link to="/admin/maintenance">정비 기록</Link>
      </nav>
      <div className="cleaning-tasks-filters">
        <label>
          <span>휴양소</span>
          <select
            value={propertyId}
            disabled={pending}
            onChange={(e) => {
              setPropertyId(e.target.value);
              setPage(1);
              setSelected(null);
            }}
          >
            <option value="">전체 휴양소</option>
            {properties.resource.status === 'ready' &&
              properties.resource.data.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.isActive ? '' : ' · 비활성'}
                </option>
              ))}
          </select>
        </label>
        <label>
          <span>상태</span>
          <select
            value={status}
            disabled={pending}
            onChange={(e) => {
              setStatus(e.target.value as CleaningTaskStatus | '');
              setPage(1);
              setSelected(null);
            }}
          >
            <option value="">할 일</option>
            {Object.entries(taskStatusLabel).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={pending || loading}
          onClick={refresh}
          aria-label="정비 작업 새로고침"
        >
          ↻
        </button>
      </div>
      {properties.resource.status === 'error' && (
        <p className="cleaning-task-warning" role="alert">
          휴양소 목록을 불러오지 못했습니다. 새로고침해 주세요.
        </p>
      )}
      {message && (
        <div className="cleaning-task-banner" role="status">
          <p>{message}</p>
          {uncertain && (
            <Button disabled={pending || loading} onClick={refresh}>
              목록 다시 확인
            </Button>
          )}
        </div>
      )}
      <div
        className={`cleaning-tasks-workspace${detailOpen ? ' has-selection' : ''}`}
      >
        <section
          className="cleaning-tasks-list"
          aria-labelledby="cleaning-tasks-title"
        >
          <header>
            <h2 id="cleaning-tasks-title">
              작업 <span>{list?.total ?? '—'}</span>
            </h2>
            <button
              type="button"
              disabled={pending || loading || uncertain}
              onClick={() =>
                void run(
                  () => syncAdminCleaningTasks(token, propertyId || undefined),
                  '퇴실 일정과 작업 목록을 동기화했습니다.',
                )
              }
            >
              일정 동기화
            </button>
          </header>
          {loading ? (
            <p className="cleaning-tasks-empty" role="status">
              작업을 불러오고 있습니다.
            </p>
          ) : !list ? (
            <p className="cleaning-tasks-empty">목록을 다시 불러와 주세요.</p>
          ) : list.items.length === 0 ? (
            <p className="cleaning-tasks-empty">
              조건에 맞는 작업이 없습니다.
              <small>기존 예약은 일정 동기화로 불러올 수 있습니다.</small>
            </p>
          ) : (
            <ul>
              {list.items.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    className={selected?.id === task.id ? 'is-selected' : ''}
                    disabled={pending}
                    onClick={() => {
                      setSelected(task);
                      setCreating(false);
                    }}
                  >
                    <span>
                      <strong>{task.property.name}</strong>
                      <small>
                        {taskTime(task.dueAt)} ·{' '}
                        {task.property.staffName ?? '미배정'}
                      </small>
                      {task.requiresReview && <em>확인 필요</em>}
                    </span>
                    <span
                      className={`cleaning-task-status is-${task.status.toLowerCase()}`}
                    >
                      {taskStatusLabel[task.status]}
                    </span>
                    <span aria-hidden="true">›</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {list && list.totalPages > 1 && (
            <nav
              className="cleaning-task-pagination"
              aria-label="정비 작업 페이지"
            >
              <button
                disabled={pending || loading || page <= 1}
                onClick={() => setPage((v) => v - 1)}
              >
                이전
              </button>
              <span>
                {page} / {list.totalPages}
              </span>
              <button
                disabled={pending || loading || page >= list.totalPages}
                onClick={() => setPage((v) => v + 1)}
              >
                다음
              </button>
            </nav>
          )}
        </section>
        {detailOpen ? (
          <CleaningTaskEditor
            key={creating ? 'new' : `${selected?.id}:${selected?.version}`}
            task={selected}
            properties={
              properties.resource.status === 'ready'
                ? properties.resource.data
                : []
            }
            pending={pending}
            locked={uncertain || loading}
            onClose={() => {
              setCreating(false);
              setSelected(null);
            }}
            onCreate={(input) =>
              run(
                () => createCleaningTask(token, input),
                '작업을 등록했습니다.',
              )
            }
            onUpdate={(task, dueAt, note) =>
              run(
                () =>
                  updateCleaningTask(token, task.id, {
                    expectedVersion: task.version,
                    dueAt,
                    note,
                  }),
                '작업을 변경했습니다.',
              )
            }
            onCancel={(task, reason) =>
              run(
                () => cancelCleaningTask(token, task.id, task.version, reason),
                '작업을 취소했습니다.',
              )
            }
          />
        ) : (
          <div className="cleaning-tasks-placeholder">
            <span aria-hidden="true">✓</span>
            <strong>작업을 선택해 주세요</strong>
            <p>일정과 담당 직원, 진행 상태를 확인할 수 있습니다.</p>
          </div>
        )}
      </div>
      <p className="cleaning-task-hint">
        작업 완료에는 점검, 정비 후 사진, 필요한 비밀번호 변경 확인이
        포함됩니다.
      </p>
    </div>
  );
}
