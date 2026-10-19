import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import '../styles/maintenance-record-info.css';
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
  presentation,
  disclosure = true,
}: {
  record: AdminSubmissionRecord;
  historical?: boolean;
  title?: string;
  children?: ReactNode;
  presentation?: 'maintenance';
  disclosure?: boolean;
}) {
  if (presentation === 'maintenance') {
    const content = <MaintenanceRecordFacts record={record} historical={historical}>{children}</MaintenanceRecordFacts>;
    return disclosure ? (
      <details className="submission-detail-disclosure maintenance-record-information">
        <summary>
          <strong>{title ?? (historical ? '당시 기록 정보' : '기록 정보')}</strong>
          <span className="submission-disclosure-indicator" aria-hidden="true">+</span>
        </summary>
        {content}
      </details>
    ) : content;
  }
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


function MaintenanceRecordFacts({ record, historical, children }: {
  record: AdminSubmissionRecord;
  historical: boolean;
  children?: ReactNode;
}) {
  const authorDetails = [
    ['연락처', record.author.phone],
    ['회사', record.author.company],
    ['부서', record.author.department],
  ] as const;
  const missingAuthorDetails = authorDetails.filter(([, value]) => !value);
  const groups: { key: string; title: string; fields: [string, ReactNode][] }[] = [
    { key: 'visit', title: '방문 정보', fields: [
      ['휴양소', <>{record.property.name}{record.property.region && <span className="submission-detail-muted"> · {record.property.region}</span>}</>],
      ['방문일', record.visitDate.replaceAll('-', '.')],
      ['점검 종류', submissionTypeLabel(record.type)],
      ['체크리스트', <>{record.template.title} · 버전 {record.template.version}</>],
      [historical ? '당시 일정' : '연결 일정', record.stayId
        ? <Link key="stay" to={`/admin/stays/${record.stayId}?view=list`}>이용 일정 보기{historical ? ' (현재 정보)' : ''} →</Link>
        : '연결된 일정 없음'],
    ] },
    { key: 'author', title: '작성자', fields: [
      ['이름', <>{record.author.name} · {submissionRoleLabel(record.author.role)}</>],
      ['작성 경로', submissionSourceLabel(record.authorSource)],
      ...authorDetails.filter(([, value]) => Boolean(value)).map(([label, value]) => [label, value] as [string, ReactNode]),
    ] },
    { key: 'saved', title: '저장 정보', fields: [
      ...(record.type === 'MAINTENANCE' ? [['작성 시작', submissionTime(record.startedAt)] as [string, ReactNode]] : []),
      ['제출 일시', submissionTime(record.submittedAt)],
      ...(record.cancelledAt ? [['취소 일시', submissionTime(record.cancelledAt)] as [string, ReactNode]] : []),
      ['최초 기록', submissionTime(record.createdAt)],
      ['마지막 저장', submissionTime(record.updatedAt)],
    ] },
  ];
  return (
    <div className="maintenance-record-facts maintenance-record-facts--compact">
      <div className="maintenance-record-facts__groups">
        {groups.map((group) => (
          <section className={`maintenance-record-facts__group maintenance-record-facts__group--${group.key}`} key={group.key}>
            <h3>{group.title}</h3>
            <dl>
              {group.fields.map(([label, value]) => (
                <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
              ))}
            </dl>
            {group.key === 'author' && missingAuthorDetails.length > 0 && (
              <details className="maintenance-record-facts__optional">
                <summary>
                  <span>추가 정보 <span className="maintenance-record-facts__optional-count">{missingAuthorDetails.length}개 미입력</span></span>
                  <span className="maintenance-record-facts__optional-chevron" aria-hidden="true">⌄</span>
                </summary>
                <dl>
                  {missingAuthorDetails.map(([label]) => <div key={label}><dt>{label}</dt><dd>미입력</dd></div>)}
                </dl>
              </details>
            )}
          </section>
        ))}
      </div>
      <footer className="maintenance-record-facts__footer">
        <p className="submission-detail-caption maintenance-record-facts__note">
          한국 시간 기준 · {historical ? '이 버전에' : '이 기록에'} 저장된 정보입니다.
          {record.authorSource === 'STAFF_QR' && ' 작성자는 직원 QR에서 확인한 담당자입니다.'}
        </p>
        {children}
      </footer>
    </div>
  );
}
