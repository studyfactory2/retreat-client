import { useEffect, useId, useRef, useState } from 'react';
import { useAdminNavigationGuard } from '../../hooks/use-admin-navigation-guard';
import type {
  AdminIssueRecordDto,
  AdminIssueSummaryDto,
} from '../../../../features/admin-issues/admin-issues.types';
import { Button } from '../../../../shared/ui/Button/Button';
import {
  prepareIssueManagementAction,
  type IssueActionCommand,
  type IssueActionError,
  type IssueActionMutation,
} from '../model/issue-action-model';
import { issueTime } from '../model/issue-presentation';
import { IssueManagementConfirmation } from './IssueManagementConfirmation';
import { IssueMutationNotice } from './IssueMutationNotice';
import {
  IssueRecurrenceCandidates,
  type IssueCandidateResource,
} from './IssueRecurrenceCandidates';

type ManagementCommand = Extract<
  IssueActionCommand,
  { kind: 'urgency' | 'recurrence' }
>;
export function IssueManagementEditor({
  issue,
  kind,
  mutation,
  candidates,
  page,
  onPage,
  onCandidatesRefresh,
  onSubmit,
  onReload,
  onDirtyChange,
  onClose,
}: {
  issue: AdminIssueRecordDto;
  kind: 'urgency' | 'recurrence';
  mutation: IssueActionMutation;
  candidates: IssueCandidateResource;
  page: number;
  onPage: (page: number) => void;
  onCandidatesRefresh: () => void;
  onSubmit: (command: IssueActionCommand) => void;
  onReload: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onClose: () => void;
}) {
  const [note, setNote] = useState('');
  const [selected, setSelected] = useState<AdminIssueSummaryDto | null>();
  const [validation, setValidation] = useState<IssueActionError>();
  const [confirmation, setConfirmation] = useState<ManagementCommand>();
  const headingId = useId();
  const noteId = useId();
  const errorId = useId();
  const hintId = useId();
  const noteInput = useRef<HTMLTextAreaElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const busy = mutation.status === 'saving';
  const blocked =
    mutation.status === 'conflict' || mutation.status === 'unknown';
  const staleCandidates =
    kind === 'recurrence' &&
    candidates.status === 'error' &&
    candidates.changed;
  const locked =
    busy ||
    blocked ||
    staleCandidates ||
    issue.cancelledAt !== null ||
    issue.currentVersion > 2_147_483_646;
  const reviewBlocked =
    locked ||
    (kind === 'recurrence' &&
      selected !== null &&
      candidates.status !== 'ready');
  const dirty = note.length > 0 || selected !== undefined;
  useAdminNavigationGuard(dirty || busy || blocked || staleCandidates);
  const count = [...note.trim()].length;
  const label =
    kind === 'urgency'
      ? issue.isUrgent
        ? '긴급 해제'
        : '긴급으로 변경'
      : '이전 이상사항 연결';
  useEffect(() => {
    onDirtyChange(dirty);
    return () => onDirtyChange(false);
  }, [dirty, onDirtyChange]);
  function review() {
    if (reviewBlocked || confirmation) return;
    if (kind === 'recurrence' && selected === undefined) {
      setValidation({
        field: 'action',
        message: '연결할 이전 신고 또는 연결 해제를 선택해 주세요.',
      });
      return;
    }
    const proposed: ManagementCommand =
      kind === 'urgency'
        ? { kind, isUrgent: !issue.isUrgent, note }
        : { kind, recurrenceOfIssueId: selected?.id ?? null, note };
    const result = prepareIssueManagementAction(issue, proposed);
    if (result.error) {
      setValidation(result.error);
      if (result.error.field === 'note') noteInput.current?.focus();
      return;
    }
    setValidation(undefined);
    setConfirmation(result.command);
  }
  return (
    <section
      className="issue-detail-card issue-management-editor"
      aria-labelledby={headingId}
    >
      <div className="issue-detail-section-heading">
        <h2 id={headingId}>{label}</h2>
      </div>
      {kind === 'urgency' && (
        <p className="issue-detail-caption">
          현재 {issue.isUrgent ? '긴급' : '일반'} →{' '}
          {issue.isUrgent ? '일반' : '긴급'} · 처리 우선순위 표시를 변경합니다.
        </p>
      )}
      <form
        ref={form}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          review();
        }}
      >
        {kind === 'recurrence' && (
          <>
            <IssueRecurrenceCandidates
              resource={candidates}
              page={page}
              selectedId={selected?.id}
              locked={locked || !!confirmation}
              onSelect={(candidate) => {
                setSelected(candidate);
                setValidation(undefined);
              }}
              onPage={onPage}
              onRetry={onCandidatesRefresh}
              onReload={onReload}
            />
            {issue.recurrenceOfIssueId !== null && (
              <label className="issue-recurrence-unlink">
                <input
                  type="radio"
                  name="issue-recurrence-unlink"
                  checked={selected === null}
                  disabled={locked || !!confirmation}
                  onChange={() => {
                    setSelected(null);
                    setValidation(undefined);
                  }}
                />
                현재 연결 해제
              </label>
            )}
            {selected !== undefined && (
              <div className="issue-recurrence-selection" role="status">
                <strong>
                  {selected ? '선택한 이전 신고' : '저장할 변경: 연결 해제'}
                </strong>
                {selected && (
                  <>
                    <p>{selected.title}</p>
                    <span>{issueTime(selected.reportedAt)}</span>
                  </>
                )}
              </div>
            )}
          </>
        )}
        {validation?.field === 'action' && (
          <p className="issue-actions__error" role="alert">
            {validation.message}
          </p>
        )}
        <div className="issue-actions__note">
          <label htmlFor={noteId}>
            변경 사유 <span>필수</span>
          </label>
          <textarea
            id={noteId}
            ref={noteInput}
            rows={3}
            value={note}
            disabled={locked || !!confirmation}
            aria-required="true"
            aria-invalid={validation?.field === 'note' || undefined}
            aria-describedby={`${hintId}${validation?.field === 'note' ? ` ${errorId}` : ''}`}
            onChange={(event) => {
              setNote(event.target.value);
              setValidation(undefined);
            }}
          />
          <p id={hintId} className="issue-actions__hint">
            변경 이유를 짧게 남겨 주세요. 최대 500자 ·{' '}
            <span className={count > 500 ? 'issue-actions__error' : undefined}>
              {count.toLocaleString('ko-KR')}자
            </span>
          </p>
          {validation?.field === 'note' && (
            <p className="issue-actions__error" id={errorId} role="alert">
              {validation.message}
            </p>
          )}
        </div>
        <IssueMutationNotice mutation={mutation} onReload={onReload} />
        {!confirmation && !blocked && (
          <div className="issue-action-buttons">
            <Button
              className="admin-button-secondary"
              disabled={busy}
              onClick={onClose}
            >
              닫기
            </Button>
            <Button type="submit" disabled={reviewBlocked}>
              변경 내용 확인
            </Button>
          </div>
        )}
      </form>
      {confirmation && (
        <IssueManagementConfirmation
          issue={issue}
          command={confirmation}
          selectedTitle={selected?.title}
          busy={busy}
          locked={reviewBlocked}
          onCancel={() => {
            setConfirmation(undefined);
            requestAnimationFrame(() =>
              form.current
                ?.querySelector<HTMLButtonElement>('button[type="submit"]')
                ?.focus(),
            );
          }}
          onConfirm={() => {
            if (reviewBlocked) return;
            setConfirmation(undefined);
            onSubmit(confirmation);
          }}
        />
      )}
    </section>
  );
}
