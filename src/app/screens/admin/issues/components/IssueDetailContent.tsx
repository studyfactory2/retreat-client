import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { AdminIssueDetailDto } from '../../../../features/admin-issues/admin-issues.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { useIssueAction } from '../hooks/use-issue-action';
import { useIssueNavigation } from '../hooks/use-issue-navigation';
import { IssueActions } from './IssueActions';
import { IssueNavigationNotice } from './IssueNavigationNotice';
import { IssueRecord } from './IssueRecord';
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
}: {
  detail: AdminIssueDetailDto;
  token: string;
  adminId: string;
  rejectSession: (token: string) => void;
  returnTo: string;
  refresh: () => void;
  acceptSaved: (detail: AdminIssueDetailDto, expectedVersion: number) => void;
}) {
  const navigate = useNavigate();
  const [dirty, setDirty] = useState(false);
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
      setDirty(false);
      setSavedNotice({
        version: receipt.issue.currentVersion,
        message:
          command.kind === 'note'
            ? '메모를 저장했습니다.'
            : command.status === 'RESOLVED'
              ? '해결 처리했습니다.'
              : detail.issue.status === 'RESOLVED'
                ? '다시 조치 중으로 변경했습니다.'
                : '조치를 시작했습니다.',
      });
      acceptSaved(receipt, detail.issue.currentVersion);
    },
  );
  const busy = mutation.status === 'saving';
  const navigation = useIssueNavigation(dirty, busy);
  const reload = () => navigation.request(refresh);
  useEffect(() => {
    if (savedNotice?.version === detail.issue.currentVersion)
      noticeRef.current?.focus();
  }, [savedNotice, detail.issue.currentVersion]);
  const { issue, report, latestEvent } = detail;
  return (
    <div className="issue-detail">
      <header className="issue-detail-heading">
        <div>
          <p className="issue-detail-eyebrow">신고 내용과 처리 기록</p>
          <h1>이상사항 상세</h1>
          <p>
            {issue.property.name} · {issue.category.name}
          </p>
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
      {savedNotice?.version === issue.currentVersion && (
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
            최초 신고와 이후 이력은 확인할 수 있습니다. 일반 목록에는 표시되지
            않습니다.
          </p>
        </div>
      )}
      <section aria-labelledby="issue-current-heading">
        <div className="issue-detail-section-heading">
          <h2 id="issue-current-heading">현재 저장된 내용</h2>
          <p className="issue-detail-caption">
            버전 {issue.currentVersion} · 한국 시간
          </p>
        </div>
        <IssueRecord record={issue} title="현재 이상사항" showSourceLink />
      </section>
      <fieldset
        className="issue-detail-action-boundary"
        disabled={navigation.pending}
        aria-label="이상사항 처리"
      >
        <IssueActions
          key={`${issue.id}:${issue.currentVersion}`}
          issue={issue}
          mutation={mutation}
          onSubmit={(command) => {
            if (!navigation.pending) void submit(command);
          }}
          onReload={reload}
          onDirtyChange={setDirty}
        />
      </fieldset>
      <section
        className="issue-original-report"
        aria-labelledby="issue-report-heading"
      >
        <div className="issue-detail-section-heading">
          <div>
            <h2 id="issue-report-heading">최초 신고</h2>
            <p className="issue-detail-caption">
              처리 이력이 추가되어도 최초 신고자와 당시 내용은 별도로
              보존됩니다.
            </p>
          </div>
        </div>
        <div className="issue-detail-card">
          <IssueEventSummary event={report} />
          <p className="issue-detail-notice">
            {report.actor.role === 'GUEST'
              ? '이용객이 직접 입력한 신고자 정보입니다.'
              : report.actor.role === 'STAFF'
                ? '신고 당시 휴양소에 배정된 직원 정보가 기록되었습니다.'
                : '최초 신고 당시 기록된 작성자 정보입니다.'}
          </p>
          <IssueRecord record={report.record} title="최초 신고 내용" />
          <IssuePhotos
            key={`report:${report.id}`}
            event={report}
            token={token}
            rejectSession={rejectSession}
          />
        </div>
      </section>
      {latestEvent.id !== report.id && (
        <section
          className="issue-detail-card"
          aria-labelledby="issue-latest-heading"
        >
          <div className="issue-detail-section-heading">
            <h2 id="issue-latest-heading">최근 처리 기록</h2>
            <p className="issue-detail-caption">버전 {latestEvent.version}</p>
          </div>
          <IssueEventSummary event={latestEvent} />
          <IssuePhotos
            key={`latest:${latestEvent.id}`}
            event={latestEvent}
            token={token}
            rejectSession={rejectSession}
          />
        </section>
      )}
      <IssueHistory
        detail={detail}
        token={token}
        rejectSession={rejectSession}
        onRefreshDetail={reload}
      />
    </div>
  );
}
