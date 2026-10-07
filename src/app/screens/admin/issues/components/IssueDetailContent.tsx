import { useEffect, useRef, useState } from 'react';
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
import { IssueRecord } from './IssueRecord';
import { IssueCurrentSummary } from './IssueCurrentSummary';
import { issueEventLabel, issueTime } from '../model/issue-presentation';
import { IssuePhotos } from './IssuePhotos';
import { IssueHistory } from './IssueHistory';
import { IssueEventSummary } from './IssueEventSummary';

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
  const { issue, report, latestEvent } = detail;
  return (
    <div className="issue-detail">
      <header className="issue-detail-heading">
        <div>
          <h1>이상사항 상세</h1>
        </div>
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
            이상사항 목록으로
          </Link>
          <Button
            className="admin-button-secondary"
            disabled={busy}
            onClick={reload}
          >
            새로고침
          </Button>
        </div>
      </header>
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
      <div className="issue-detail-workspace">
        <div className="issue-detail-overview">
          <IssueCurrentSummary issue={issue} original={report.record} />
          <section
            className="issue-detail-card issue-original-evidence"
            aria-label="최초 신고 사진"
          >
            <IssuePhotos
              key={`report:${report.id}`}
              event={report}
              title="최초 신고 사진"
              token={token}
              rejectSession={rejectSession}
            />
          </section>
        </div>
        <fieldset
          className="issue-detail-action-boundary issue-detail-card"
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
          >
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
          </IssueManagementSummary>
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
        </fieldset>
      </div>
      <details className="issue-detail-disclosure issue-original-report">
        <summary>
          <span>
            <strong>최초 신고</strong>
            <span className="issue-detail-caption">
              신고 당시 내용 · 신고자 · 출처
            </span>
          </span>
          <span className="issue-disclosure-indicator" aria-hidden="true">
            +
          </span>
        </summary>
        <div className="issue-disclosure-body">
          <IssueEventSummary event={report} />
          <p className="issue-detail-caption">
            {report.actor.role === 'GUEST'
              ? '신고자 정보는 이용객이 직접 입력했습니다.'
              : report.actor.role === 'STAFF'
                ? '신고 당시 배정된 직원 정보입니다.'
                : '최초 신고 당시 작성자 정보입니다.'}
          </p>
          <IssueRecord
            record={report.record}
            title="최초 신고 당시 내용"
            showSourceLink
            onNavigate={openIssue}
          />
        </div>
      </details>
      <details className="issue-detail-disclosure issue-audit-disclosure">
        <summary>
          <span>
            <strong>
              처리 이력{' '}
              <span className="issue-disclosure-count">
                버전 {issue.currentVersion}
              </span>
            </strong>
            <span className="issue-detail-caption">
              최근: {issueEventLabel(latestEvent.type)} ·{' '}
              {issueTime(latestEvent.createdAt)}
              {latestEvent.photos.length > 0
                ? ` · 사진 ${latestEvent.photos.length}장`
                : ''}
            </span>
            {latestEvent.note && (
              <span className="issue-history-preview">{latestEvent.note}</span>
            )}
          </span>
          <span className="issue-disclosure-indicator" aria-hidden="true">
            +
          </span>
        </summary>
        <div className="issue-disclosure-body">
          <IssueHistory
            detail={detail}
            token={token}
            rejectSession={rejectSession}
            onRefreshDetail={reload}
            onNavigate={openIssue}
          />
        </div>
      </details>
    </div>
  );
}
