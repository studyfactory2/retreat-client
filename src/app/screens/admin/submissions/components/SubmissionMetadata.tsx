import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { AdminSubmissionRecord } from '../../../../features/admin-submissions/admin-submissions.types';
import {
  submissionRoleLabel,
  submissionSourceLabel,
  submissionTime,
  submissionTypeLabel,
} from '../model/submission-detail-model';

export function SubmissionMetadata({
  record,
  historical = false,
  title,
  children,
}: {
  record: AdminSubmissionRecord;
  historical?: boolean;
  title?: string;
  children?: ReactNode;
}) {
  return (
    <details className="submission-detail-disclosure submission-metadata">
      <summary>
        <span>
          <strong>
            {title ?? (historical ? '당시 저장된 기본 정보' : '제출 기본 정보')}
          </strong>
          <span className="submission-detail-caption">
            작성자 · 연락처 · 출처 · 체크리스트
          </span>
        </span>
        <span className="submission-disclosure-indicator" aria-hidden="true">
          +
        </span>
      </summary>
      <div className="submission-metadata-body">
        <dl className="submission-detail-grid">
          <div>
            <dt>휴양소</dt>
            <dd>
              {record.property.name}
              {record.property.region && (
                <span className="submission-detail-muted">
                  {' '}
                  · {record.property.region}
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt>체크 종류 / 방문일</dt>
            <dd>
              {submissionTypeLabel(record.type)} · {record.visitDate}
            </dd>
          </div>
          <div>
            <dt>작성자</dt>
            <dd>
              {record.author.name} · {submissionRoleLabel(record.author.role)}
            </dd>
          </div>
          <div>
            <dt>작성 경로</dt>
            <dd>{submissionSourceLabel(record.authorSource)}</dd>
          </div>
          <div>
            <dt>연락처</dt>
            <dd>{record.author.phone || '미입력'}</dd>
          </div>
          <div>
            <dt>회사 / 부서</dt>
            <dd>
              {record.author.company || '미입력'} /{' '}
              {record.author.department || '미입력'}
            </dd>
          </div>
          <div>
            <dt>{historical ? '당시 연결된 이용 일정' : '연결된 이용 일정'}</dt>
            <dd>
              {record.stayId ? (
                <Link to={`/admin/stays/${record.stayId}?view=list`}>
                  이용 일정 보기{historical ? ' (현재 정보)' : ''} →
                </Link>
              ) : (
                '연결되지 않음'
              )}
            </dd>
          </div>
          <div>
            <dt>사용한 체크리스트</dt>
            <dd>
              {record.template.title} · 버전 {record.template.version}
            </dd>
          </div>
          {record.type === 'MAINTENANCE' && (
            <div>
              <dt>작성 시작</dt>
              <dd>{submissionTime(record.startedAt)}</dd>
            </div>
          )}
          <div>
            <dt>제출 시각</dt>
            <dd>{submissionTime(record.submittedAt)}</dd>
          </div>
          {record.cancelledAt && (
            <div>
              <dt>취소 시각</dt>
              <dd>{submissionTime(record.cancelledAt)}</dd>
            </div>
          )}
          <div>
            <dt>최초 기록 / 마지막 저장</dt>
            <dd>
              {submissionTime(record.createdAt)}
              <br />
              {submissionTime(record.updatedAt)}
            </dd>
          </div>
        </dl>
        <p className="submission-detail-caption">
          한국 시간 기준 · 휴양소·작성자·체크리스트 문구는 이 기록에 저장된
          내용입니다.
        </p>
        {children}
        {record.authorSource === 'STAFF_QR' && (
          <p className="submission-detail-caption">
            직원 QR에서 확인한 담당자 정보입니다.
          </p>
        )}
      </div>
    </details>
  );
}
