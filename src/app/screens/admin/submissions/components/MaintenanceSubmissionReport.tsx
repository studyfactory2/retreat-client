import { useRef, useState, type KeyboardEvent } from 'react';
import type { AdminSubmissionDetail } from '../../../../features/admin-submissions/admin-submissions.types';
import { SubmissionRecord } from './SubmissionRecord';
import { SubmissionMetadata } from './SubmissionMetadata';
import { SubmissionPhotos } from './SubmissionPhotos';
import { SubmissionHistory } from './SubmissionHistory';
import { ScheduleIcon } from '../../schedule/components/ScheduleIcon';
import {
  submissionActionLabel,
  submissionRoleLabel,
  submissionSourceLabel,
  submissionTime,
  submissionTypeLabel,
} from '../model/submission-detail-model';

type ReportTab = 'answers' | 'photos' | 'history' | 'information';
const tabOrder: ReportTab[] = ['answers', 'photos', 'history', 'information'];

export function MaintenanceSubmissionReport({
  detail,
  token,
  rejectSession,
  onRefreshDetail,
}: {
  detail: AdminSubmissionDetail;
  token: string;
  rejectSession: (token: string) => void;
  onRefreshDetail: () => void;
}) {
  const [tab, setTab] = useState<ReportTab>('answers');
  const tabButtons = useRef(new Map<ReportTab, HTMLButtonElement>());
  const { revision } = detail;
  const { record } = revision;
  const labels: Record<ReportTab, string> = {
    answers: '점검 내용',
    photos: `사진 ${revision.photos.length}`,
    history: '변경 이력',
    information: '기록 정보',
  };
  function moveTab(event: KeyboardEvent<HTMLButtonElement>) {
    const index = tabOrder.indexOf(tab);
    const next = event.key === 'ArrowRight'
      ? tabOrder[(index + 1) % tabOrder.length]
      : event.key === 'ArrowLeft'
        ? tabOrder[(index + tabOrder.length - 1) % tabOrder.length]
        : event.key === 'Home'
          ? tabOrder[0]
          : event.key === 'End'
            ? tabOrder[tabOrder.length - 1]
            : undefined;
    if (!next) return;
    event.preventDefault();
    setTab(next);
    tabButtons.current.get(next)?.focus();
  }
  return (
    <section className="maintenance-report" aria-labelledby="maintenance-report-title">
      <header className="maintenance-report__heading">
        <div className="maintenance-report__summary-top">
          <div className="submission-report-kicker">
            <span>{submissionTypeLabel(record.type)}</span>
            <span aria-label={`버전 ${detail.currentRevision}`}>v{detail.currentRevision}</span>
          </div>
          <span className={`submission-detail-badge ${detail.status === 'CANCELLED' ? 'submission-detail-badge--muted' : 'submission-detail-badge--success'}`}>
            {detail.status === 'CANCELLED' ? '취소됨' : '제출됨'}
          </span>
        </div>
        <h2 id="maintenance-report-title">{record.property.name}</h2>
        <p className="maintenance-report__meta">
          <span aria-label={`방문일 ${record.visitDate}`}><ScheduleIcon name="calendar" />{record.visitDate.replaceAll('-', '.')}</span>
          <span className="maintenance-report__meta-divider" aria-hidden="true">·</span>
          <span aria-label={`작성자 ${record.author.name}`}>{record.author.name}</span>
        </p>
        {record.type === 'CHECK_IN' && (
          <p className="maintenance-report__meta">
            사진 {revision.photos.length}장 · 이상 {record.answers.items.filter((item) => item.value === 'ABNORMAL').length}건
          </p>
        )}
        {detail.status === 'CANCELLED' && (
          <p className="submission-detail-notice maintenance-report__cancelled">
            취소된 기록입니다. 답변과 사진은 보존되어 있습니다.
          </p>
        )}
      </header>
      <div className="maintenance-report__tabs" role="tablist" aria-label="제출 기록 내용">
        {tabOrder.map((value) => (
          <button
            type="button"
            key={value}
            id={`maintenance-tab-${value}`}
            role="tab"
            aria-selected={tab === value}
            aria-controls={`maintenance-panel-${value}`}
            tabIndex={tab === value ? 0 : -1}
            ref={(element) => {
              if (element) tabButtons.current.set(value, element);
              else tabButtons.current.delete(value);
            }}
            onKeyDown={moveTab}
            onClick={() => setTab(value)}
          >
            {labels[value]}
          </button>
        ))}
      </div>
      {tabOrder.map((value) => (
        <div
          key={value}
          id={`maintenance-panel-${value}`}
          role="tabpanel"
          aria-labelledby={`maintenance-tab-${value}`}
          tabIndex={0}
          hidden={tab !== value}
          className={`maintenance-report__panel maintenance-report__panel--${value}`}
        >
          {tab === value && (value === 'answers' ? (
            <div className="maintenance-current-record">
              <SubmissionRecord record={record} presentation="maintenance" includeMetadata={false} />
            </div>
          ) : value === 'photos' ? (
            <SubmissionPhotos
              key={revision.id}
              revision={revision}
              token={token}
              rejectSession={rejectSession}
              presentation="maintenance"
            />
          ) : value === 'history' ? (
            <SubmissionHistory
              submissionId={detail.id}
              currentRevision={detail.currentRevision}
              token={token}
              rejectSession={rejectSession}
              onRefreshDetail={onRefreshDetail}
              presentation="maintenance"
            />
          ) : (
            <SubmissionMetadata record={record} presentation="maintenance" disclosure={false}>
              <div className="submission-current-change">
                <p>
                  <strong>버전 {detail.currentRevision} · {submissionActionLabel(revision.action)}</strong>
                  {' · '}{submissionTime(revision.createdAt)}
                </p>
                <p>
                  {revision.actor.name} · {submissionRoleLabel(revision.actor.role)} · {submissionSourceLabel(revision.actorSource)}
                </p>
                {revision.reason && <p className="submission-detail-text"><strong>사유: </strong>{revision.reason}</p>}
              </div>
            </SubmissionMetadata>
          ))}
        </div>
      ))}
    </section>
  );
}
