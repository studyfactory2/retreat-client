import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AdminIssueDetailDto } from '../../../../features/admin-issues/admin-issues.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { AdminBackButton } from '../../components/AdminBackButton';
import { ScheduleIcon } from '../../schedule/components/ScheduleIcon';
import { useIssueAction } from '../hooks/use-issue-action';
import { useIssueNavigation } from '../hooks/use-issue-navigation';
import { useIssueRecurrenceCandidates } from '../hooks/use-issue-recurrence-candidates';
import { useIssueLinkedReport } from '../hooks/use-issue-linked-report';
import {
  issueActionSavedMessage,
  type IssueActionSelection,
} from '../model/issue-action-model';
import {
  IssueManagementSummary,
  type IssueEditorKind,
} from './IssueManagementSummary';
import { IssueManagementEditor } from './IssueManagementEditor';
import { IssueLifecycleEditor } from './IssueLifecycleEditor';
import { issueLifecycleSavedMessage } from '../model/issue-lifecycle-model';
import { IssueActions } from './IssueActions';
import { IssueNavigationNotice } from './IssueNavigationNotice';
import { IssueCurrentSummary } from './IssueCurrentSummary';
import {
  issueActorRoleLabel,
  issueEventLabel,
  issueEventTransition,
  issueListTime,
  issueStatusLabel,
  issueStatusTone,
  issueTime,
} from '../model/issue-presentation';
import { IssuePhotos } from './IssuePhotos';
import { IssueHistory } from './IssueHistory';
import '../styles/issue-detail.css';
import '../styles/issue-management.css';
import '../styles/issue-workspace.css';

export function IssueDetailContent({
  detail,
  token,
  adminId,
  rejectSession,
  returnTo,
  refresh,
  acceptSaved,
  lifecycleNotice,
  onLifecycleSaved,
  clearLifecycleNotice,
  embedded = false,
}: {
  detail: AdminIssueDetailDto;
  token: string;
  adminId: string;
  rejectSession: (token: string) => void;
  returnTo: string;
  refresh: () => void;
  acceptSaved: (detail: AdminIssueDetailDto, expectedVersion: number) => void;
  lifecycleNotice?: string;
  onLifecycleSaved: (message: string) => void;
  clearLifecycleNotice: () => void;
  embedded?: boolean;
}) {
  const navigate = useNavigate();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyVisited, setHistoryVisited] = useState(false);
  const [managementOpen, setManagementOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeEditor, setActiveEditor] = useState<IssueEditorKind>('record');
  const [selectedAction, setSelectedAction] =
    useState<IssueActionSelection | null>(null);
  const [candidatePage, setCandidatePage] = useState(1);
  const [savedNotice, setSavedNotice] = useState<{
    version: number;
    message: string;
  } | null>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const historyId = useId();
  const managementId = useId();
  const editorId = useId();
  const { mutation, submit } = useIssueAction(
    detail,
    token,
    adminId,
    rejectSession,
    (receipt, command) => {
      clearLifecycleNotice();
      setDirty(false);
      setCandidatePage(1);
      setActiveEditor('record');
      setSelectedAction(null);
      setManagementOpen(false);
      setHistoryOpen(true);
      setHistoryVisited(true);
      setSavedNotice({
        version: receipt.issue.currentVersion,
        message: issueActionSavedMessage(command, detail.issue.status),
      });
      acceptSaved(receipt, detail.issue.currentVersion);
    },
    (receipt, command) => {
      setDirty(false);
      setCandidatePage(1);
      setActiveEditor('record');
      setSelectedAction(null);
      setManagementOpen(false);
      onLifecycleSaved(
        issueLifecycleSavedMessage(command.kind, receipt.version),
      );
    },
  );
  const busy = mutation.status === 'saving';
  const navigation = useIssueNavigation(dirty, busy);
  const reload = () => navigation.request(refresh);
  const candidates = useIssueRecurrenceCandidates(
    detail.issue,
    candidatePage,
    activeEditor === 'recurrence',
    token,
    rejectSession,
  );
  const linked = useIssueLinkedReport(detail.issue, token, rejectSession);
  const blocked =
    mutation.status === 'conflict' ||
    mutation.status === 'unknown' ||
    (candidates.resource.status === 'error' && candidates.resource.changed);
  const { issue, report, latestEvent } = detail;
  const DetailHeading = embedded ? 'h2' : 'h1';
  const editable =
    issue.cancelledAt === null && issue.currentVersion <= 2_147_483_646;
  const editorOpen = selectedAction !== null || activeEditor !== 'record';
  const locked = busy || blocked || navigation.pending;
  function closeEditor() {
    if (busy || blocked || navigation.pending) return;
    navigation.request(() => {
      setDirty(false);
      setSelectedAction(null);
      setActiveEditor('record');
      setCandidatePage(1);
      requestAnimationFrame(() =>
        overviewRef.current?.focus({ preventScroll: true }),
      );
    });
  }
  function openEditor(kind: IssueEditorKind) {
    if (kind === 'record') {
      closeEditor();
      return;
    }
    if (locked || activeEditor === kind) return;
    navigation.request(() => {
      setDirty(false);
      setSelectedAction(null);
      setCandidatePage(1);
      setActiveEditor(kind);
      setManagementOpen(false);
    });
  }
  function openAction(action: IssueActionSelection) {
    if (locked || !editable) return;
    navigation.request(() => {
      setDirty(false);
      setActiveEditor('record');
      setSelectedAction(action);
      setManagementOpen(false);
    });
  }
  const openIssue = (to: string) => navigation.request(() => navigate(to));
  useEffect(() => {
    if (lifecycleNotice || savedNotice?.version === issue.currentVersion)
      noticeRef.current?.focus();
  }, [savedNotice, lifecycleNotice, issue.currentVersion]);
  useEffect(() => {
    if (editorOpen) editorRef.current?.focus({ preventScroll: true });
  }, [editorOpen, activeEditor, selectedAction]);
  return (
    <div
      className={`issue-detail issue-detail--compact${embedded ? ' issue-detail--embedded' : ''}`}
    >
      {navigation.pending && (
        <IssueNavigationNotice
          onKeep={navigation.keep}
          onDiscard={navigation.discard}
        />
      )}
      <section className="issue-workspace" aria-labelledby={headingId}>
        <div className="issue-workspace-tools">
          <div className="issue-workspace-back">
            <AdminBackButton
              label="이상사항 목록으로 돌아가기"
              disabled={busy || navigation.pending}
              onBack={() => navigation.request(() => navigate(returnTo))}
            />
            <span aria-hidden="true">이상사항</span>
          </div>
          <div className="issue-workspace-tools__right">
            <Button
              className="admin-button-secondary issue-workspace-refresh"
              aria-label="현재 이상사항 새로고침"
              title="새로고침"
              disabled={busy || navigation.pending}
              onClick={reload}
            >
              <ScheduleIcon name="refresh" />
            </Button>
            <Button
              className="admin-button-secondary issue-workspace-manage"
              aria-expanded={managementOpen}
              aria-controls={managementId}
              disabled={busy || navigation.pending}
              onClick={() => setManagementOpen((value) => !value)}
            >
              신고 관리 <ScheduleIcon name="more" />
            </Button>
          </div>
        </div>
        <div
          id={managementId}
          className="issue-workspace-management"
          hidden={!managementOpen}
        >
          <IssueManagementSummary
            issue={issue}
            activeEditor={activeEditor}
            locked={locked}
            linked={linked.resource}
            onLinkedRefresh={linked.refresh}
            onEdit={openEditor}
            onNavigate={openIssue}
          >
            {issue.currentVersion <= 2_147_483_646 && (
              <Button
                className={`admin-button-secondary${issue.cancelledAt === null ? ' issue-lifecycle-danger' : ''}`}
                disabled={
                  locked ||
                  activeEditor === 'cancel' ||
                  activeEditor === 'restore'
                }
                onClick={() =>
                  openEditor(issue.cancelledAt === null ? 'cancel' : 'restore')
                }
              >
                {issue.cancelledAt === null ? '신고 취소' : '신고 복원'}
              </Button>
            )}
            {editable && issue.status === 'NEW' && (
              <Button
                className="admin-button-secondary"
                disabled={locked}
                onClick={() => openAction('RESOLVED')}
              >
                바로 해결 처리
              </Button>
            )}
            {editable && issue.status === 'RESOLVED' && (
              <Button
                className="admin-button-secondary"
                disabled={locked}
                onClick={() => openAction('IN_PROGRESS')}
              >
                다시 조치
              </Button>
            )}
          </IssueManagementSummary>
        </div>
        <header className="issue-workspace-heading">
          <div className="issue-workspace-context">
            <p>{issue.property.name}</p>
            <div className="issue-detail-badges" aria-label="현재 처리 상태">
              <span
                className={`issue-detail-badge issue-detail-badge--${issueStatusTone(issue.status)}`}
              >
                {issueStatusLabel(issue.status)}
              </span>
              {issue.cancelledAt && (
                <span className="issue-detail-badge issue-detail-badge--muted">
                  취소됨
                </span>
              )}
            </div>
          </div>
          <DetailHeading id={headingId}>{issue.title}</DetailHeading>
          {issue.isUrgent && (
            <span className="issue-detail-badge issue-detail-badge--danger issue-workspace-urgent">
              긴급
            </span>
          )}
        </header>
        {(lifecycleNotice || savedNotice?.version === issue.currentVersion) && (
          <div
            className="issue-detail-success"
            role="status"
            ref={noticeRef}
            tabIndex={-1}
          >
            {lifecycleNotice || savedNotice?.message}
          </div>
        )}
        {issue.cancelledAt && (
          <div className="issue-detail-cancelled" role="status">
            <strong>취소된 신고</strong>
            <p>
              {issueTime(issue.cancelledAt)} ·{' '}
              {issue.cancellationReason || '기록된 사유 없음'}
            </p>
            <p>기존 내용과 사진·이력은 보존됩니다.</p>
          </div>
        )}
        <div
          ref={overviewRef}
          tabIndex={-1}
          className="issue-workspace-overview"
          hidden={editorOpen}
        >
          <div className="issue-report-card">
            <IssueCurrentSummary
              issue={issue}
              original={report.record}
              reporter={report.actor}
              onNavigate={openIssue}
            >
              {!editorOpen && report.photos.length > 0 && (
                <IssuePhotos
                  key={`report:${report.id}`}
                  event={report}
                  title="신고 사진"
                  token={token}
                  rejectSession={rejectSession}
                />
              )}
            </IssueCurrentSummary>
            {latestEvent.id !== report.id && (
              <section
                className="issue-latest-update"
                aria-label="최근 처리 기록"
              >
                <div className="issue-latest-update__heading">
                  <h2>
                    {latestEvent.type === 'REPAIR_REPORTED'
                      ? '최근 직원 보고'
                      : issueEventLabel(latestEvent.type)}
                  </h2>
                </div>
                {latestEvent.note && (
                  <p className="issue-latest-update__note">
                    {latestEvent.note}
                  </p>
                )}
                {issueEventTransition(latestEvent) && (
                  <p className="issue-latest-update__transition">
                    {issueEventTransition(latestEvent)}
                  </p>
                )}
                <p className="issue-latest-update__identity">
                  <span>
                    {latestEvent.actor.name} ·{' '}
                    {issueActorRoleLabel(latestEvent.actor.role)}
                  </span>
                  <time dateTime={latestEvent.createdAt}>
                    {issueListTime(latestEvent.createdAt)}
                  </time>
                </p>
                {latestEvent.type === 'REPAIR_REPORTED' && (
                  <p className="issue-latest-update__notice">
                    직원 보고 · 관리자 해결 처리와 별개
                  </p>
                )}
                {!editorOpen && latestEvent.photos.length > 0 && (
                  <IssuePhotos
                    key={`latest:${latestEvent.id}`}
                    event={latestEvent}
                    title="조치 사진"
                    token={token}
                    rejectSession={rejectSession}
                  />
                )}
              </section>
            )}
          </div>
          {editable && (
            <div
              className={`issue-next-actions${issue.status === 'RESOLVED' ? ' issue-next-actions--resolved' : ''}`}
            >
              <Button
                className="admin-button-secondary"
                disabled={locked}
                onClick={() => openAction('NOTE')}
              >
                메모 추가
              </Button>
              {issue.status !== 'RESOLVED' && (
                <Button
                  disabled={locked}
                  onClick={() =>
                    openAction(
                      issue.status === 'NEW' ? 'IN_PROGRESS' : 'RESOLVED',
                    )
                  }
                >
                  {issue.status === 'NEW' ? '조치 시작' : '해결 처리'}{' '}
                  <ScheduleIcon
                    name={issue.status === 'NEW' ? 'arrow' : 'check'}
                  />
                </Button>
              )}
            </div>
          )}
          {issue.currentVersion > 2_147_483_646 && (
            <p className="issue-detail-notice">
              이 기록에는 변경 내용을 더 추가할 수 없습니다. 저장된 내용과
              이력을 확인해 주세요.
            </p>
          )}
        </div>
        {editorOpen && (
          <div
            ref={editorRef}
            tabIndex={-1}
            id={editorId}
            className="issue-editor-panel"
          >
            <fieldset
              className="issue-detail-action-boundary"
              disabled={navigation.pending}
              aria-label="이상사항 처리"
            >
              {activeEditor === 'cancel' || activeEditor === 'restore' ? (
                <IssueLifecycleEditor
                  key={`${issue.id}:${issue.currentVersion}:${activeEditor}`}
                  issue={issue}
                  action={activeEditor}
                  mutation={mutation}
                  onSubmit={(command) => {
                    if (!navigation.pending) void submit(command);
                  }}
                  onReload={reload}
                  onDirtyChange={setDirty}
                  onClose={closeEditor}
                />
              ) : activeEditor === 'record' && selectedAction ? (
                <IssueActions
                  key={`${issue.id}:${issue.currentVersion}:${selectedAction}`}
                  issue={issue}
                  selection={selectedAction}
                  mutation={mutation}
                  onSubmit={(command) => {
                    if (!navigation.pending) void submit(command);
                  }}
                  onReload={reload}
                  onDirtyChange={setDirty}
                  onClose={closeEditor}
                />
              ) : activeEditor === 'urgency' ||
                activeEditor === 'recurrence' ? (
                <IssueManagementEditor
                  key={`${issue.id}:${issue.currentVersion}:${activeEditor}`}
                  issue={issue}
                  kind={activeEditor}
                  mutation={mutation}
                  candidates={candidates.resource}
                  page={candidatePage}
                  onPage={setCandidatePage}
                  onCandidatesRefresh={candidates.refresh}
                  onSubmit={(command) => {
                    if (!navigation.pending) void submit(command);
                  }}
                  onReload={reload}
                  onDirtyChange={setDirty}
                  onClose={closeEditor}
                />
              ) : null}
            </fieldset>
          </div>
        )}
        <div className="issue-workspace-history">
          <Button
            className="admin-button-secondary issue-workspace-history__toggle"
            aria-expanded={historyOpen}
            aria-controls={historyId}
            onClick={() => {
              setHistoryOpen((value) => !value);
              setHistoryVisited(true);
            }}
          >
            <span>
              처리 이력{' '}
              <span className="issue-workspace-history__count">
                {issue.currentVersion}
              </span>
            </span>
            <ScheduleIcon name="chevron" />
          </Button>
          <div id={historyId} hidden={!historyOpen}>
            {historyVisited && (
              <IssueHistory
                detail={detail}
                token={token}
                rejectSession={rejectSession}
                onRefreshDetail={reload}
                onNavigate={openIssue}
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
