import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { AdminIssueDetailDto } from '../../../../features/admin-issues/admin-issues.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { useIssueAction } from '../hooks/use-issue-action';
import { useIssueNavigation } from '../hooks/use-issue-navigation';
import { useIssueRecurrenceCandidates } from '../hooks/use-issue-recurrence-candidates';
import { useIssueLinkedReport } from '../hooks/use-issue-linked-report';
import { issueActionSavedMessage } from '../model/issue-action-model';
import {
  IssueManagementSummary,
  type IssueEditorKind,
} from './IssueManagementSummary';
import { IssueManagementEditor } from './IssueManagementEditor';
import '../styles/issue-management.css';
import { IssueLifecycleEditor } from './IssueLifecycleEditor';
import { issueLifecycleSavedMessage } from '../model/issue-lifecycle-model';
import { IssueActions } from './IssueActions';
import { IssueNavigationNotice } from './IssueNavigationNotice';
import { IssueCurrentSummary } from './IssueCurrentSummary';
import { issueStatusLabel, issueStatusTone, issueTime } from '../model/issue-presentation';
import { IssuePhotos } from './IssuePhotos';
import { IssueHistory } from './IssueHistory';
import '../styles/issue-workspace.css';

type IssueTab = 'report' | 'processing' | 'history';
const issueTabs: { id: IssueTab; label: string }[] = [
  { id: 'report', label: '신고 내용' },
  { id: 'processing', label: '처리' },
  { id: 'history', label: '이력' },
];

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
}) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<IssueTab>('report');
  const [historyVisited, setHistoryVisited] = useState(false);
  const tabButtons = useRef(new Map<IssueTab, HTMLButtonElement>());
  const [dirty, setDirty] = useState(false);
  const [activeEditor, setActiveEditor] = useState<IssueEditorKind>('record');
  const [candidatePage, setCandidatePage] = useState(1);
  const [savedNotice, setSavedNotice] = useState<{
    version: number;
    message: string;
  } | null>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
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
  const openEditor = (kind: IssueEditorKind) => {
    if (busy || blocked || navigation.pending || activeEditor === kind) return;
    navigation.request(() => {
      setDirty(false);
      setCandidatePage(1);
      setActiveEditor(kind);
    });
  };
  const openIssue = (to: string) => navigation.request(() => navigate(to));
  useEffect(() => {
    if (lifecycleNotice || savedNotice?.version === detail.issue.currentVersion)
      noticeRef.current?.focus();
  }, [savedNotice, lifecycleNotice, detail.issue.currentVersion]);
  function selectTab(next: IssueTab) {
    if (busy || navigation.pending) return;
    setTab(next);
    if (next === 'history') setHistoryVisited(true);
  }
  function moveTab(event: KeyboardEvent<HTMLButtonElement>) {
    const index = issueTabs.findIndex((item) => item.id === tab);
    const next = event.key === 'ArrowRight' ? issueTabs[(index + 1) % issueTabs.length]
      : event.key === 'ArrowLeft' ? issueTabs[(index + issueTabs.length - 1) % issueTabs.length]
        : event.key === 'Home' ? issueTabs[0]
          : event.key === 'End' ? issueTabs[issueTabs.length - 1] : undefined;
    if (!next || busy || navigation.pending) return;
    event.preventDefault();
    selectTab(next.id);
    tabButtons.current.get(next.id)?.focus();
  }
  const { issue, report } = detail;
  return (
    <div className="issue-detail issue-detail--compact">
      <div className="issue-workspace-toolbar">
        <div className="issue-detail-actions">
          <Link
            className="ui-button admin-button-secondary"
            to={returnTo}
            aria-disabled={busy || undefined}
            onClick={(event) => {
              event.preventDefault();
              navigation.request(() => navigate(returnTo));
            }}
          >
            <span aria-hidden="true">←</span> 목록
          </Link>
          <Button
            className="admin-button-secondary"
            disabled={busy}
            onClick={reload}
          >
            새로고침
          </Button>
        </div>
      </div>
      {navigation.pending && (
        <IssueNavigationNotice
          onKeep={navigation.keep}
          onDiscard={navigation.discard}
        />
      )}
      {lifecycleNotice && (
        <div
          className="issue-detail-success"
          role="status"
          ref={noticeRef}
          tabIndex={-1}
        >
          {lifecycleNotice}
        </div>
      )}
      {!lifecycleNotice && savedNotice?.version === issue.currentVersion && (
        <div
          className="issue-detail-success"
          role="status"
          ref={noticeRef}
          tabIndex={-1}
        >
          {savedNotice.message} 현재 내용과 처리 이력에 반영되었습니다.
        </div>
      )}
      {issue.cancelledAt && (
        <div className="issue-detail-cancelled" role="status">
          <strong>취소된 이상사항입니다.</strong>
          <p>
            처리 상태와 증거는 유지됩니다. {issueTime(issue.cancelledAt)} 취소
          </p>
          <p className="issue-detail-text">
            <strong>취소 사유: </strong>
            {issue.cancellationReason || '기록된 사유 없음'}
          </p>
        </div>
      )}
      <section className="issue-workspace" aria-labelledby="issue-workspace-title">
        <header className="issue-workspace-heading">
          <div>
            <h1 id="issue-workspace-title">{issue.title}</h1>
            <p>{issue.property.name}{issue.property.region && <span> · {issue.property.region}</span>}</p>
          </div>
          <div className="issue-detail-badges" aria-label="현재 처리 상태와 긴급도">
            <span className={`issue-detail-badge issue-detail-badge--${issueStatusTone(issue.status)}`}>
              {issueStatusLabel(issue.status)}
            </span>
            {issue.isUrgent && <span className="issue-detail-badge issue-detail-badge--danger">긴급</span>}
            {issue.cancelledAt && <span className="issue-detail-badge issue-detail-badge--muted">취소됨</span>}
          </div>
        </header>
        <div className="issue-workspace-tabs" role="tablist" aria-label="이상사항 상세">
          {issueTabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`issue-tab-${item.id}`}
              aria-controls={`issue-panel-${item.id}`}
              aria-selected={tab === item.id}
              tabIndex={tab === item.id ? 0 : -1}
              disabled={busy || !!navigation.pending}
              ref={(element) => {
                if (element) tabButtons.current.set(item.id, element);
                else tabButtons.current.delete(item.id);
              }}
              onKeyDown={moveTab}
              onClick={() => selectTab(item.id)}
            >
              {item.label}{item.id === 'processing' && dirty && <span className="issue-draft-indicator" aria-label="저장하지 않은 입력"> · 작성 중</span>}
            </button>
          ))}
        </div>
        <div id="issue-panel-report" role="tabpanel" aria-labelledby="issue-tab-report" hidden={tab !== 'report'} className="issue-workspace-panel" tabIndex={0}>
          <IssueCurrentSummary
            issue={issue}
            original={report.record}
            reporter={report.actor}
            onNavigate={openIssue}
          />
          {tab === 'report' && report.photos.length > 0 && (
            <IssuePhotos key={`report:${report.id}`} event={report} title="최초 신고 사진" token={token} rejectSession={rejectSession} />
          )}
        </div>
        <div id="issue-panel-processing" role="tabpanel" aria-labelledby="issue-tab-processing" hidden={tab !== 'processing'} className="issue-workspace-panel" tabIndex={0}>
          <fieldset
            className="issue-detail-action-boundary"
            disabled={navigation.pending}
            aria-label="이상사항 처리"
          >
            <IssueManagementSummary
              issue={issue}
              activeEditor={activeEditor}
              locked={busy || blocked || navigation.pending}
              linked={linked.resource}
              onLinkedRefresh={linked.refresh}
              onEdit={openEditor}
              onNavigate={openIssue}
            />
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
                onClose={() => openEditor('record')}
              />
            ) : activeEditor === 'record' ? (
              <IssueActions
                key={`${issue.id}:${issue.currentVersion}:record`}
                issue={issue}
                mutation={mutation}
                onSubmit={(command) => {
                  if (!navigation.pending) void submit(command);
                }}
                onReload={reload}
                onDirtyChange={setDirty}
              />
            ) : (
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
                onClose={() => openEditor('record')}
              />
            )}
            {issue.currentVersion <= 2_147_483_646 && (
              <div className="issue-lifecycle-actions">
                {issue.cancelledAt === null ? (
                  <Button
                    className="admin-button-secondary issue-lifecycle-danger"
                    disabled={
                      busy ||
                      blocked ||
                      navigation.pending ||
                      activeEditor === 'cancel'
                    }
                    aria-expanded={activeEditor === 'cancel'}
                    onClick={() => openEditor('cancel')}
                  >
                    신고 취소
                  </Button>
                ) : (
                  <Button
                    className="admin-button-secondary"
                    disabled={
                      busy ||
                      blocked ||
                      navigation.pending ||
                      activeEditor === 'restore'
                    }
                    aria-expanded={activeEditor === 'restore'}
                    onClick={() => openEditor('restore')}
                  >
                    신고 복원
                  </Button>
                )}
              </div>
            )}
          </fieldset>
        </div>
        <div id="issue-panel-history" role="tabpanel" aria-labelledby="issue-tab-history" hidden={tab !== 'history'} className="issue-workspace-panel" tabIndex={0}>
          {historyVisited && (
            <IssueHistory detail={detail} token={token} rejectSession={rejectSession} onRefreshDetail={reload} onNavigate={openIssue} />
          )}
        </div>
      </section>
    </div>
  );
}
