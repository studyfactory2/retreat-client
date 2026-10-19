import type { AdminSubmissionRecord } from '../../../../features/admin-submissions/admin-submissions.types';
import { SubmissionMetadata } from './SubmissionMetadata';

export function SubmissionRecord({
  record,
  historical = false,
  presentation,
  includeMetadata = true,
}: {
  record: AdminSubmissionRecord;
  historical?: boolean;
  presentation?: 'maintenance';
  includeMetadata?: boolean;
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
      <section
        className="submission-detail-card"
        aria-label={presentation === 'maintenance' ? '점검 내용' : undefined}
      >
        {presentation !== 'maintenance' && (
          <div className="submission-detail-section-heading">
            <h3>{historical ? '이 버전의 체크 내용' : '현재 체크 내용'}</h3>
            <p>
              {record.answers.items.length} / {itemCount}항목 응답
            </p>
          </div>
        )}
        {record.template.definition.sections.map((section, index) => (
          <section className="submission-check-section" key={section.id}>
            {presentation === 'maintenance' ? (
              <div className="maintenance-check-section-heading">
                <h3>{section.title}</h3>
                {index === 0 && (
                  <p>{record.answers.items.length} / {itemCount}항목 응답</p>
                )}
              </div>
            ) : <h4>{section.title}</h4>}
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
                          className={`submission-detail-badge ${!answer ? 'submission-detail-badge--muted' : answer.value === 'ABNORMAL' ? 'submission-detail-badge--danger' : 'submission-detail-badge--success'}`}
                        >
                          {answer
                            ? answer.value === 'NORMAL'
                              ? '정상'
                              : presentation === 'maintenance'
                                ? '이상 응답'
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
                            {presentation === 'maintenance'
                              ? '조치 기록'
                              : '현장 조치 기록'}
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
                        <strong>
                          {presentation === 'maintenance'
                            ? '직원 조치 기록'
                            : '직원 조치 내용'}
                        </strong>
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
            {presentation === 'maintenance'
              ? '직원 조치 기록과 이상사항 처리 상태는 별도로 관리됩니다.'
              : '현장 조치는 직원이 남긴 기록이며, 이상사항의 처리 상태와 별개입니다.'}
          </p>
        )}
      </section>
      <section className={`submission-detail-card submission-general-note${presentation === 'maintenance' && !record.answers.generalNote ? ' submission-general-note--empty' : ''}`}>
        <h3>{presentation === 'maintenance' ? '메모' : '전체 메모'}</h3>
        <p className="submission-detail-text">
          {record.answers.generalNote || (presentation === 'maintenance' ? '메모 없음' : '작성된 메모가 없습니다.')}
        </p>
      </section>
      {includeMetadata && (
        <SubmissionMetadata record={record} historical={historical} />
      )}
    </div>
  );
}
