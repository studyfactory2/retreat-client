import { useEffect, useId, useRef, useState } from 'react';
import { useAdminNavigationGuard } from '../../hooks/use-admin-navigation-guard';
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
import {
  IssueActionConfirmation,
  type IssueActionConfirmationState,
} from './IssueActionConfirmation';
import '../styles/issue-actions.css';

export function IssueActions({
  issue,
  mutation,
  selection,
  onSubmit,
  onReload,
  onDirtyChange,
  onClose,
}: {
  issue: AdminIssueRecordDto;
  mutation: IssueActionMutation;
  selection?: IssueActionSelection;
  onSubmit: (command: IssueActionCommand) => void;
  onReload: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onClose?: () => void;
}) {
  const [pickedAction, setPickedAction] =
    useState<IssueActionSelection>('NOTE');
  const action = selection ?? pickedAction;
  const [note, setNote] = useState('');
  const [validation, setValidation] = useState<IssueActionError>();
  const [confirmation, setConfirmation] =
    useState<IssueActionConfirmationState>();
  const form = useRef<HTMLFormElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const noteInput = useRef<HTMLTextAreaElement>(null);
  const notice = useRef<HTMLDivElement>(null);
  const confirmationTrigger = useRef<'reset' | 'note' | 'status'>('status');
  const headingId = useId();
  const noteId = useId();
  const errorId = useId();
  const actionErrorId = useId();
  const hintId = useId();
  const dirty =
    note.length > 0 || (selection === undefined && pickedAction !== 'NOTE');
  const busy = mutation.status === 'saving';
  const blocked =
    mutation.status === 'conflict' || mutation.status === 'unknown';
  const unavailable =
    issue.cancelledAt !== null || issue.currentVersion > 2_147_483_646;
  const locked = busy || blocked || unavailable;
  useAdminNavigationGuard(dirty || busy || blocked);
  const noteRequired = issueActionNoteRequired(issue.status, action);
  const noteLabel = issueActionNoteLabel(issue.status, action);
  const actionLabel =
    issueActionOptions(issue.status).find((option) => option.value === action)
      ?.label ?? '조치 기록';
  const count = [...note.trim()].length;

  useEffect(() => {
    onDirtyChange(dirty);
    return () => onDirtyChange(false);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    if (selection !== undefined)
      heading.current?.focus({ preventScroll: true });
  }, [selection]);
  useEffect(() => {
    if (
      mutation.status === 'error' ||
      mutation.status === 'conflict' ||
      mutation.status === 'unknown'
    )
      notice.current?.focus();
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
  function validateAndReview() {
    if (locked || confirmation) return;
    const prepared = prepareIssueAction(issue, action, note);
    if (prepared.error) {
      setValidation(prepared.error);
      requestAnimationFrame(() => {
        if (prepared.error.field === 'note') noteInput.current?.focus();
        else if (selection !== undefined) heading.current?.focus();
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
    if (prepared.command.kind === 'note') {
      beginConfirmation({ kind: 'note', command: prepared.command });
    } else {
      beginConfirmation({ kind: 'status', command: prepared.command });
    }
  }
  function confirmAction() {
    if (locked || !confirmation) return;
    if (confirmation.kind === 'reset') {
      setPickedAction('NOTE');
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
      className={`issue-detail-card issue-actions${selection !== undefined ? ' issue-actions--focused' : ''}`}
      aria-labelledby={headingId}
    >
      <h3
        id={headingId}
        ref={heading}
        tabIndex={-1}
        className={
          selection === undefined || confirmation
            ? 'issue-action-sr-only'
            : 'issue-actions__heading'
        }
      >
        {selection === undefined ? '조치 기록' : actionLabel}
      </h3>
      {unavailable ? (
        <p className="issue-detail-notice">
          이 기록에는 더 이상 변경 내용을 추가할 수 없습니다. 저장된 내용과
          이력을 확인해 주세요.
        </p>
      ) : (
        <>
          <form
            ref={form}
            hidden={!!confirmation}
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              validateAndReview();
            }}
          >
            {selection === undefined && (
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
                      className={action === option.value ? 'is-selected' : ''}
                    >
                      <input
                        type="radio"
                        name="issue-action"
                        value={option.value}
                        checked={action === option.value}
                        aria-invalid={
                          validation?.field === 'action' || undefined
                        }
                        onChange={() => {
                          setPickedAction(option.value);
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
            )}
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
              <div className="issue-actions__note-heading">
                <label htmlFor={noteId}>
                  {noteLabel} <span>{noteRequired ? '필수' : '선택'}</span>
                </label>
                <p id={hintId} className="issue-actions__hint">
                  <span className="issue-action-sr-only">입력 </span>
                  <span
                    className={
                      count > 2000 ? 'issue-actions__error' : undefined
                    }
                  >
                    {count.toLocaleString('ko-KR')}
                  </span>
                  {' / '}
                  <span className="issue-action-sr-only">최대 </span>2,000자
                </p>
              </div>
              <textarea
                id={noteId}
                ref={noteInput}
                rows={4}
                placeholder={
                  action === 'RESOLVED'
                    ? '확인한 결과와 해결 내용을 남겨 주세요.'
                    : '확인한 내용이나 조치 계획을 남겨 주세요.'
                }
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
                {onClose ? (
                  <Button
                    className="admin-button-secondary"
                    disabled={busy}
                    onClick={onClose}
                  >
                    돌아가기
                  </Button>
                ) : (
                  <Button
                    className="admin-button-secondary"
                    data-issue-reset
                    disabled={busy || !dirty}
                    onClick={() => beginConfirmation({ kind: 'reset' })}
                  >
                    입력 초기화
                  </Button>
                )}
                <Button type="submit" loading={busy}>
                  내용 확인
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
