import { useState } from 'react';
import type { CleaningTaskDto } from '../../../../features/cleaning-tasks/cleaning-tasks.types';
import type { AdminPropertyOption } from '../../../../features/admin-properties/admin-properties.types';
import {
  taskDateInput,
  taskDateIso,
  taskStatusLabel,
  taskTime,
} from '../../../../features/cleaning-tasks/cleaning-tasks-display';
import { Button } from '../../../../shared/ui/Button/Button';
import { AdminMessagingPanel } from '../../components/AdminMessagingPanel';

export function CleaningTaskEditor({
  task,
  properties,
  pending,
  locked,
  token,
  rejectSession,
  messagingBusy,
  onMessagingInteractionChange,
  onCreate,
  onUpdate,
  onCancel,
  onClose,
}: {
  task: CleaningTaskDto | null;
  properties: AdminPropertyOption[];
  pending: boolean;
  locked: boolean;
  token: string;
  rejectSession: (token: string) => void;
  messagingBusy: boolean;
  onMessagingInteractionChange: (busy: boolean, pending: boolean) => void;
  onCreate: (data: {
    requestKey: string;
    propertyId: string;
    dueAt: string;
    note?: string;
  }) => Promise<void>;
  onUpdate: (
    task: CleaningTaskDto,
    dueAt: string,
    note: string | null,
  ) => Promise<void>;
  onCancel: (task: CleaningTaskDto, reason: string) => Promise<void>;
  onClose: () => void;
}) {
  const [requestKey] = useState(() => crypto.randomUUID());
  const [propertyId, setPropertyId] = useState(
    task?.property.id ?? properties.find((p) => p.isActive)?.id ?? '',
  );
  const [dueAt, setDueAt] = useState(
    taskDateInput(task?.dueAt ?? new Date().toISOString()),
  );
  const [note, setNote] = useState(task?.note ?? '');
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [messageSummary, setMessageSummary] = useState('미리보기 · 발송 기록');
  const closed = task?.status === 'COMPLETED' || task?.status === 'CANCELLED';
  const disabled = pending || locked || messagingBusy;
  return (
    <section
      className="cleaning-task-editor"
      aria-labelledby="task-editor-title"
    >
      <header>
        <h2 id="task-editor-title">{task ? '작업 상세' : '작업 등록'}</h2>
        <button
          type="button"
          aria-label="작업 상세 닫기"
          disabled={pending || messagingBusy}
          onClick={onClose}
        >
          ×
        </button>
      </header>
      {task && (
        <div className="cleaning-task-summary">
          <strong>{task.property.name}</strong>
          <span>
            {task.source === 'AUTO' ? '퇴실 후 청소·정비' : '추가 정비'} ·{' '}
            {taskStatusLabel[task.status]}
          </span>
          <p>담당 직원 · {task.property.staffName ?? '미배정'}</p>
          {task.departingStay && (
            <p>퇴실 예정 · {taskTime(task.departingStay.checkOutAt)}</p>
          )}
          {task.completedAt && <p>완료 · {taskTime(task.completedAt)}</p>}
          {task.requiresReview && (
            <p className="cleaning-task-warning">
              일정·비밀번호 또는 제출 기록의 변경을 확인해 주세요. 기존 기록은
              유지됩니다.
            </p>
          )}
          {task.status === 'COMPLETED' && task.currentSubmissionId && (
            <a href={`/admin/submissions/${task.currentSubmissionId}`}>
              정비 기록 보기 →
            </a>
          )}
        </div>
      )}
      {closed ? (
        <div className="cleaning-task-readonly">
          <p>작업 예정 · {taskTime(task.dueAt)}</p>
          {task.note && <p>{task.note}</p>}
          <small>완료·취소 기록은 수정되지 않습니다.</small>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (disabled) return;
            setError('');
            try {
              const date = taskDateIso(dueAt);
              if (!task && !propertyId)
                throw new Error('휴양소를 선택해 주세요.');
              void (task
                ? onUpdate(task, date, note.trim() || null)
                : onCreate({
                    requestKey,
                    propertyId,
                    dueAt: date,
                    ...(note.trim() ? { note: note.trim() } : {}),
                  }));
            } catch (error: unknown) {
              setError(
                error instanceof Error
                  ? error.message
                  : '입력 내용을 확인해 주세요.',
              );
            }
          }}
        >
          {!task && (
            <label>
              휴양소
              <select
                value={propertyId}
                disabled={disabled}
                required
                onChange={(e) => setPropertyId(e.target.value)}
              >
                <option value="">선택해 주세요</option>
                {properties
                  .filter((p) => p.isActive)
                  .map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </label>
          )}
          <label>
            작업 일시 <small>한국 시간</small>
            <input
              type="datetime-local"
              required
              value={dueAt}
              disabled={disabled}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </label>
          <label>
            메모 <small>선택</small>
            <textarea
              rows={3}
              maxLength={500}
              value={note}
              disabled={disabled}
              placeholder="작업에 필요한 내용을 남겨 주세요."
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          {task?.source === 'AUTO' && (
            <p className="cleaning-task-hint">
              일시를 수정하면 이 작업에만 적용됩니다. 예약의 퇴실 일시는 바뀌지
              않습니다.
            </p>
          )}
          {error && (
            <p className="cleaning-task-warning" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" loading={pending} disabled={disabled}>
            {task ? '변경 저장' : '작업 등록'}
          </Button>
        </form>
      )}
      {task && !closed && (
        <div className="cleaning-task-cancel">
          {!cancelling ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => setCancelling(true)}
            >
              작업 취소
            </button>
          ) : (
            <>
              <strong>이 작업을 취소할까요?</strong>
              <p>작성한 점검 내용과 사진은 삭제되지 않습니다.</p>
              <label>
                취소 사유
                <input
                  value={reason}
                  maxLength={500}
                  disabled={disabled}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <div>
                <Button
                  className="admin-button-secondary"
                  disabled={disabled}
                  onClick={() => setCancelling(false)}
                >
                  계속 유지
                </Button>
                <Button
                  disabled={disabled || !reason.trim()}
                  onClick={() => void onCancel(task, reason.trim())}
                >
                  취소 확인
                </Button>
              </div>
            </>
          )}
        </div>
      )}
      {task && (
        <details className="cleaning-task-messaging">
          <summary
            onClick={(event) => {
              if (messagingBusy) event.preventDefault();
            }}
          >
            안내 메시지 <small>{messageSummary}</small>
          </summary>
          <AdminMessagingPanel
            subjectType="TASK"
            subjectId={task.id}
            token={token}
            rejectSession={rejectSession}
            disabled={pending || locked}
            onSummaryChange={setMessageSummary}
            onInteractionChange={onMessagingInteractionChange}
          />
        </details>
      )}
    </section>
  );
}
