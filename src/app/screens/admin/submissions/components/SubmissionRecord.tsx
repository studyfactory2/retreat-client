import { Link } from 'react-router-dom';
import type { AdminSubmissionRecord } from '../../../../features/admin-submissions/admin-submissions.types';
import {
  submissionRoleLabel,
  submissionSourceLabel,
  submissionTime,
  submissionTypeLabel,
} from '../model/submission-detail-model';

export function SubmissionRecord({
  record,
  historical = false,
}: {
  record: AdminSubmissionRecord;
  historical?: boolean;
}) {
  const answers = new Map(
    record.answers.items.map((answer) => [answer.itemId, answer]),
  );
  const itemCount = record.template.definition.sections.reduce(
    (total, section) => total + section.items.length,
    0,
  );
  return (
    <div className="submission-record">
      <section className="submission-detail-card">
        <h3>{historical ? '당시 저장된 기본 정보' : '제출 기본 정보'}</h3>
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
                <Link to={`/admin/stays/${record.stayId}?from=list`}>
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
              <dt>정비 시작</dt>
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
        {record.authorSource === 'STAFF_QR' && (
          <p className="submission-detail-caption">
            직원 QR에서 확인한 담당자 정보입니다.
          </p>
        )}
      </section>
      <section className="submission-detail-card">
        <div className="submission-detail-section-heading">
          <h3>체크 내용</h3>
          <p>
            {record.answers.items.length} / {itemCount}항목 응답
          </p>
        </div>
        {record.template.definition.sections.map((section) => (
          <section className="submission-check-section" key={section.id}>
            <h4>{section.title}</h4>
            <ul className="submission-check-items">
              {section.items.map((item) => {
                const answer = answers.get(item.id);
                return (
                  <li
                    className={`submission-check-item${answer?.value === 'ABNORMAL' ? ' submission-check-item--abnormal' : ''}`}
                    key={item.id}
                  >
                    <div className="submission-check-item__heading">
                      <strong>{item.label}</strong>
                      <div className="submission-check-badges">
                        <span
                          className={`submission-detail-badge ${answer?.value === 'ABNORMAL' ? 'submission-detail-badge--danger' : ''}`}
                        >
                          {answer
                            ? answer.value === 'NORMAL'
                              ? '정상'
                              : '이상'
                            : '미응답'}
                        </span>
                        {!item.required && (
                          <span className="submission-detail-muted">
                            선택 항목
                          </span>
                        )}
                        {answer?.isUrgent && (
                          <span className="submission-detail-badge submission-detail-badge--danger">
                            긴급
                          </span>
                        )}
                        {answer?.repairReported && (
                          <span className="submission-detail-badge">
                            현장 조치 기록
                          </span>
                        )}
                      </div>
                    </div>
                    {answer?.value === 'ABNORMAL' && (
                      <p className="submission-detail-text">
                        {answer.description || '추가 설명 없음'}
                      </p>
                    )}
                    {answer?.repairReported && (
                      <div className="submission-repair-note">
                        <strong>직원 조치 내용</strong>
                        <p className="submission-detail-text">
                          {answer.repairNote || '조치 내용 미입력'}
                        </p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        {record.answers.items.some((answer) => answer.repairReported) && (
          <p className="submission-detail-caption">
            현장 조치는 직원이 남긴 기록이며, 이상사항의 처리 상태와 별개입니다.
          </p>
        )}
      </section>
      <section className="submission-detail-card">
        <h3>전체 메모</h3>
        <p className="submission-detail-text">
          {record.answers.generalNote || '작성된 메모가 없습니다.'}
        </p>
      </section>
    </div>
  );
}
