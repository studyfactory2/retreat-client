import type { StaffDraftDto } from '../../../../features/staff-drafts/staff-drafts.types';
import type { StaffSubmissionPhotoInput } from '../../../../features/staff-submissions/staff-submissions.types';
import { staffPhotoPurposes } from '../model/staff-flow-model';

export function StaffSubmissionReview({
  draft,
  photos,
}: {
  draft: StaffDraftDto;
  photos: StaffSubmissionPhotoInput[];
}) {
  const abnormal = draft.answers.items.filter(
    (answer) => answer.value === 'ABNORMAL',
  );
  return (
    <section className="staff-draft-card staff-flow-review">
      <span className="staff-draft-eyebrow">마지막 확인</span>
      <h2>이 내용으로 제출할까요?</h2>
      <p className="staff-draft-hint">
        {draft.author.name} · {draft.visitDate}
      </p>
      <div className="staff-flow-review-counts">
        <span>
          점검 <strong>{draft.answers.items.length}개</strong>
        </span>
        <span>
          이상 <strong>{abnormal.length}개</strong>
        </span>
        <span>
          사진 <strong>{photos.length}장</strong>
        </span>
      </div>
      {draft.template.definition.sections.map((section) => (
        <div key={section.id} className="staff-flow-review-section">
          <h3>{section.title}</h3>
          <ul>
            {section.items.map((item) => {
              const answer = draft.answers.items.find(
                (value) => value.itemId === item.id,
              );
              return (
                <li key={item.id}>
                  <div>
                    <span>{item.label}</span>
                    <strong
                      className={
                        answer?.value === 'ABNORMAL' ? 'is-abnormal' : ''
                      }
                    >
                      {answer?.value === 'ABNORMAL'
                        ? '이상 있음'
                        : answer
                          ? '정상'
                          : '미응답 · 선택'}
                    </strong>
                  </div>
                  {answer?.description && <p>{answer.description}</p>}
                  {answer?.isUrgent && (
                    <p className="is-abnormal">긴급 확인 요청</p>
                  )}
                  {answer?.repairReported && (
                    <p>
                      수리 보고
                      {answer.repairNote ? ` · ${answer.repairNote}` : ''}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {draft.answers.generalNote && (
        <div className="staff-flow-review-note">
          <h3>전달할 메모</h3>
          <p>{draft.answers.generalNote}</p>
        </div>
      )}
      {photos.length > 0 && (
        <details className="staff-flow-details">
          <summary>사진 {photos.length}장 연결 정보</summary>
          <ul className="staff-flow-photo-summary">
            {photos.map((photo, index) => {
              const section = draft.template.definition.sections.find(
                (value) =>
                  value.id === photo.sectionId ||
                  value.items.some((item) => item.id === photo.itemId),
              );
              const item = section?.items.find(
                (value) => value.id === photo.itemId,
              );
              return (
                <li key={photo.attachmentId}>
                  <strong>
                    사진 {index + 1} · {staffPhotoPurposes[photo.purpose]}
                  </strong>
                  <span>
                    {section?.title}
                    {item ? ` · ${item.label}` : ''}
                  </span>
                </li>
              );
            })}
          </ul>
        </details>
      )}
      <p className="staff-flow-submit-note">
        아직 제출되지 않았어요. 아래의 <strong>정비 완료 제출</strong>을 누르면
        관리자에게 전달됩니다.
      </p>
    </section>
  );
}
