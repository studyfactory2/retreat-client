import { useEffect, useId, useRef, useState } from 'react';
import type { AdminIssueRecordDto } from '../../../../features/admin-issues/admin-issues.types';
import { Button } from '../../../../shared/ui/Button/Button';
import {
  issueActionNoteLabel,
  issueActionNoteRequired,
  issueActionOptions,
  prepareIssueAction,
  type IssueActionCommand,
  type IssueActionError,
  type IssueActionMutation,
  type IssueActionSelection,
} from '../model/issue-action-model';
import { issueStatusLabel, issueStatusTone } from '../model/issue-presentation';
import {
  IssueActionConfirmation,
  type IssueActionConfirmationState,
} from './IssueActionConfirmation';
import '../styles/issue-actions.css';

export function IssueActions({
  issue,
  mutation,
  onSubmit,
  onReload,
  onDirtyChange,
}: {
  issue: AdminIssueRecordDto;
  mutation: IssueActionMutation;
  onSubmit: (command: IssueActionCommand) => void;
  onReload: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [selection, setSelection] = useState<IssueActionSelection>('NOTE');
  const [note, setNote] = useState('');
  const [validation, setValidation] = useState<IssueActionError>();
  const [confirmation, setConfirmation] =
    useState<IssueActionConfirmationState>();
  const form = useRef<HTMLFormElement>(null);
  const noteInput = useRef<HTMLTextAreaElement>(null);
  const notice = useRef<HTMLDivElement>(null);
  const confirmationTrigger = useRef<'reset' | 'status'>('status');
  const headingId = useId();
  const noteId = useId();
  const errorId = useId();
  const actionErrorId = useId();
  const hintId = useId();
  const dirty = note.length > 0 || selection !== 'NOTE';
  const busy = mutation.status === 'saving';
  const blocked =
    mutation.status === 'conflict' || mutation.status === 'unknown';
  const unavailable =
    issue.cancelledAt !== null || issue.currentVersion > 2_147_483_646;
  const locked = busy || blocked || unavailable;
  const noteRequired = issueActionNoteRequired(issue.status, selection);
  const noteLabel = issueActionNoteLabel(issue.status, selection);
  const count = [...note.trim()].length;

  useEffect(() => {
    onDirtyChange(dirty);
    return () => onDirtyChange(false);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    if (
      mutation.status === 'error' ||
      mutation.status === 'conflict' ||
      mutation.status === 'unknown'
    ) {
      notice.current?.focus();
    }
  }, [mutation.status, mutation.message]);

  function beginConfirmation(next: IssueActionConfirmationState) {
    confirmationTrigger.current = next.kind;
    setConfirmation(next);
  }
  function cancelConfirmation() {
    setConfirmation(undefined);
    requestAnimationFrame(() => {
      const selector =
        confirmationTrigger.current === 'reset'
          ? 'button[data-issue-reset]'
          : 'button[type="submit"]';
      form.current?.querySelector<HTMLButtonElement>(selector)?.focus();
    });
  }
  function validateAndSubmit() {
    if (locked || confirmation) return;
    const prepared = prepareIssueAction(issue, selection, note);
    if (prepared.error) {
      setValidation(prepared.error);
      requestAnimationFrame(() => {
        if (prepared.error.field === 'note') noteInput.current?.focus();
        else
          form.current
            ?.querySelector<HTMLInputElement>(
              'input[name="issue-action"]:checked',
            )
            ?.focus();
      });
      return;
    }
    setValidation(undefined);
    if (prepared.command.kind === 'note') onSubmit(prepared.command);
    else beginConfirmation({ kind: 'status', command: prepared.command });
  }
  function confirmAction() {
    if (locked || !confirmation) return;
    if (confirmation.kind === 'reset') {
      setSelection('NOTE');
      setNote('');
      setValidation(undefined);
      setConfirmation(undefined);
      requestAnimationFrame(() => noteInput.current?.focus());
    } else {
      setConfirmation(undefined);
      onSubmit(confirmation.command);
    }
  }
  if (issue.cancelledAt !== null) return null;
  return (
    <section
      className="issue-detail-card issue-actions"
      aria-labelledby={headingId}
    >
      <div className="issue-detail-section-heading">
        <div>
          <p className="issue-actions__eyebrow">관리자 처리</p>
          <h2 id={headingId}>처리 내용을 기록하세요</h2>
        </div>
        <span
          className={`issue-detail-badge issue-detail-badge--${issueStatusTone(issue.status)}`}
        >
          {issueStatusLabel(issue.status)}
        </span>
      </div>
      <p className="issue-actions__intro">
        확인한 내용과 조치 결과를 남기면 담당 관리자와 함께 처리 이력에
        기록됩니다.
      </p>
      {unavailable ? (
        <p className="issue-detail-notice">
          이 기록에는 더 이상 변경 내용을 추가할 수 없습니다. 저장된 내용과
          이력을 확인해 주세요.
        </p>
      ) : (
        <>
          <form
            ref={form}
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              validateAndSubmit();
            }}
          >
            <fieldset
              className="issue-actions__choices"
              disabled={locked || !!confirmation}
              aria-describedby={
                validation?.field === 'action' ? actionErrorId : undefined
              }
            >
              <legend>처리 방법</legend>
              <div>
                {issueActionOptions(issue.status).map((option) => (
                  <label
                    key={option.value}
                    className={selection === option.value ? 'is-selected' : ''}
                  >
                    <input
                      type="radio"
                      name="issue-action"
                      value={option.value}
                      checked={selection === option.value}
                      aria-invalid={validation?.field === 'action' || undefined}
                      onChange={() => {
                        setSelection(option.value);
                        setValidation(undefined);
                      }}
                    />
                    <span>
                      <strong>{option.label}</strong>
                      <span>{option.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            {validation?.field === 'action' && (
              <p
                className="issue-actions__error"
                id={actionErrorId}
                role="alert"
              >
                {validation.message}
              </p>
            )}
            <div className="issue-actions__note">
              <label htmlFor={noteId}>
                {noteLabel} <span>{noteRequired ? '필수' : '선택'}</span>
              </label>
              <textarea
                id={noteId}
                ref={noteInput}
                rows={5}
                value={note}
                disabled={locked || !!confirmation}
                aria-required={noteRequired}
                aria-invalid={validation?.field === 'note' || undefined}
                aria-describedby={`${hintId}${validation?.field === 'note' ? ` ${errorId}` : ''}`}
                onChange={(event) => {
                  setNote(event.target.value);
                  setValidation(undefined);
                }}
              />
              <p id={hintId} className="issue-actions__hint">
                {noteRequired
                  ? '확인한 내용과 처리 사유를 입력해 주세요.'
                  : '필요한 경우 확인한 내용을 함께 남겨 주세요.'}{' '}
                최대 2000자 ·{' '}
                <span
                  className={count > 2000 ? 'issue-actions__error' : undefined}
                >
                  {count.toLocaleString('ko-KR')}자
                </span>
              </p>
              {validation?.field === 'note' && (
                <p className="issue-actions__error" id={errorId} role="alert">
                  {validation.message}
                </p>
              )}
            </div>
            {mutation.status !== 'idle' && mutation.status !== 'saving' && (
              <div
                className="issue-action-notice"
                role="alert"
                tabIndex={-1}
                ref={notice}
              >
                <p>
                  {mutation.message ||
                    (mutation.status === 'unknown'
                      ? '저장 결과를 확인하지 못했습니다. 이미 저장되었을 수 있습니다. 최신 기록과 이력을 확인해 주세요.'
                      : mutation.status === 'conflict'
                        ? '기록이 변경되었습니다. 최신 내용을 확인한 뒤 다시 진행해 주세요.'
                        : '입력 내용을 확인한 뒤 다시 시도해 주세요.')}
                </p>
                {blocked && (
                  <>
                    <p>
                      최신 내용을 불러오기 전에 아직 저장하지 않은 입력을 확인해
                      주세요.
                    </p>
                    <Button
                      className="admin-button-secondary"
                      onClick={onReload}
                    >
                      최신 기록 확인
                    </Button>
                  </>
                )}
              </div>
            )}
            {!blocked && !confirmation && (
              <div className="issue-action-buttons">
                <Button
                  className="admin-button-secondary"
                  data-issue-reset
                  disabled={busy || !dirty}
                  onClick={() => beginConfirmation({ kind: 'reset' })}
                >
                  입력 초기화
                </Button>
                <Button type="submit" loading={busy}>
                  {selection === 'NOTE' ? '메모 저장' : '변경 내용 확인'}
                </Button>
              </div>
            )}
          </form>
          {confirmation && (
            <IssueActionConfirmation
              issue={issue}
              confirmation={confirmation}
              busy={busy}
              onConfirm={confirmAction}
              onCancel={cancelConfirmation}
            />
          )}
        </>
      )}
    </section>
  );
}
