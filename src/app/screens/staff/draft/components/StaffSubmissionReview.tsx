import type { StaffDraftDto } from '../../../../features/staff-drafts/staff-drafts.types';
import type { StaffSubmissionPhotoInput } from '../../../../features/staff-submissions/staff-submissions.types';
import { staffPhotoPurposes } from '../model/staff-flow-model';
import '../styles/staff-finish.css';

export function StaffSubmissionReview({
  draft,
  photos,
}: {
  draft: StaffDraftDto;
  photos: StaffSubmissionPhotoInput[];
}) {
  const abnormal = draft.answers.items.filter(
    (answer) => answer.value === 'ABNORMAL',
  ).length;
  const after = photos.filter(
    (photo) => photo.purpose === 'MAINTENANCE_AFTER',
  ).length;
  return (
    <section className="staff-finish-panel" aria-label="제출 내용">
      <h2>제출 내용</h2>
      <div className="staff-finish-metrics">
        <div>
          <span>점검 답변</span>
          <strong>{draft.answers.items.length}개</strong>
        </div>
        <div>
          <span>이상 응답</span>
          <strong>{abnormal}개</strong>
        </div>
        <div>
          <span>첨부 사진</span>
          <strong>{photos.length}장</strong>
        </div>
      </div>
      <details className="staff-finish-disclosure">
        <summary>점검 내용{draft.answers.generalNote && ' · 메모'}</summary>
        {draft.template.definition.sections.map((section) => (
          <div className="staff-review-section" key={section.id}>
            <h3>{section.title}</h3>
            <ul>
              {section.items.map((item) => {
                const answer = draft.answers.items.find(
                  (value) => value.itemId === item.id,
                );
                return (
                  <li key={item.id}>
                    <div className="staff-review-answer">
                      <span>{item.label}</span>
                      <strong data-abnormal={answer?.value === 'ABNORMAL'}>
                        {answer?.value === 'ABNORMAL'
                          ? '이상 있음'
                          : answer
                            ? '정상'
                            : '미응답'}
                      </strong>
                    </div>
                    {answer?.description && <p>{answer.description}</p>}
                    {answer?.isUrgent && <p>긴급 확인 요청</p>}
                    {answer?.repairReported && (
                      <p>
                        직원 조치 보고
                        {answer.repairNote && ` · ${answer.repairNote}`}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {draft.answers.generalNote && (
          <div className="staff-review-section">
            <h3>메모</h3>
            <p>{draft.answers.generalNote}</p>
          </div>
        )}
      </details>
      {photos.length > 0 && (
        <details className="staff-finish-disclosure">
          <summary>
            사진 연결 정보 <span>정비 후 {after}장</span>
          </summary>
          <ul className="staff-review-photo-list">
            {photos.map((photo, index) => {
              const section = draft.template.definition.sections.find(
                (value) =>
                  value.id === photo.sectionId ||
                  value.items.some((item) => item.id === photo.itemId),
              );
              const item = section?.items.find(
                (value) => value.id === photo.itemId,
              );
              const location =
                photo.areaLabel ??
                [section?.title, item?.label].filter(Boolean).join(' · ');
              return (
                <li key={photo.attachmentId}>
                  <strong>
                    사진 {index + 1} · {staffPhotoPurposes[photo.purpose]}
                  </strong>
                  {location && <span>{location}</span>}
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </section>
  );
}
