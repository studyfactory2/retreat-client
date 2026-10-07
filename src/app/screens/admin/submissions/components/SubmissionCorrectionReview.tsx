import type { AdminSubmissionCorrectionInput } from '../../../../features/admin-submissions/admin-submission-correction.types';
import { useEffect, useId, useRef, useState } from 'react';
import type {
  AdminSubmissionAnswer,
  AdminSubmissionDetail,
} from '../../../../features/admin-submissions/admin-submissions.types';
import { Button } from '../../../../shared/ui/Button/Button';
import {
  correctionConsequences,
  type CorrectionAnswer,
} from '../model/submission-correction-model';
import {
  submissionPhotoLocation,
  submissionPhotoPurpose,
} from '../model/submission-detail-model';

function AnswerSummary({
  answer,
}: {
  answer?: CorrectionAnswer &
    Partial<Pick<AdminSubmissionAnswer, 'repairReported' | 'repairNote'>>;
}) {
  if (!answer) return <p>미응답</p>;
  return (
    <div>
      <p>
        <strong>{answer.value === 'NORMAL' ? '정상' : '이상'}</strong>
        {answer.isUrgent && ' · 답변 긴급'}
      </p>
      {answer.description && (
        <p className="submission-detail-text">{answer.description}</p>
      )}
      {answer.repairReported && (
        <p className="submission-detail-text">
          직원 조치 보고{answer.repairNote ? `: ${answer.repairNote}` : ''}
        </p>
      )}
    </div>
  );
}
export function SubmissionCorrectionReview({
  detail,
  input,
  disabled,
  busy,
  blocked,
  onBack,
  onSave,
}: {
  detail: AdminSubmissionDetail;
  input: AdminSubmissionCorrectionInput;
  disabled: boolean;
  busy: boolean;
  blocked: boolean;
  onBack: () => void;
  onSave: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const headingId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  const consequences = correctionConsequences(detail, input);
  const record = detail.revision.record;
  return (
    <section
      className="submission-correction-review"
      aria-labelledby={headingId}
    >
      <h3 id={headingId} ref={heading} tabIndex={-1}>
        정정 내용을 확인해 주세요
      </h3>
      <p className="submission-detail-caption">
        현재 버전 {input.expectedRevision}을 기준으로 저장합니다. 원래 작성자와
        제출 시각은 유지됩니다.
      </p>
      {!consequences.changed && (
        <p className="submission-detail-notice">
          저장된 답변·전체 메모와 같습니다. 확인하더라도 새 정정 이력은 추가되지
          않습니다.
        </p>
      )}
      {consequences.changes.map(({ item, section, before, after }) => (
        <article className="submission-correction-change" key={item.id}>
          <h4>
            <small>{section}</small>
            {item.label}
          </h4>
          <div className="submission-correction-compare">
            <div>
              <h5>정정 전</h5>
              <AnswerSummary answer={before} />
            </div>
            <div>
              <h5>정정 후</h5>
              <AnswerSummary
                answer={
                  after && {
                    ...after,
                    repairReported:
                      after.value === 'ABNORMAL' && !!before?.repairReported,
                    repairNote:
                      after.value === 'ABNORMAL' ? before?.repairNote : null,
                  }
                }
              />
            </div>
          </div>
        </article>
      ))}
      {consequences.noteChanged && (
        <article className="submission-correction-change">
          <h4>전체 메모</h4>
          <div className="submission-correction-compare">
            <div>
              <h5>정정 전</h5>
              <p className="submission-detail-text">
                {record.answers.generalNote || '메모 없음'}
              </p>
            </div>
            <div>
              <h5>정정 후</h5>
              <p className="submission-detail-text">
                {input.generalNote || '메모 없음'}
              </p>
            </div>
          </div>
        </article>
      )}
      <div className="submission-correction-change">
        <h4>정정 사유</h4>
        <p className="submission-detail-text">{input.reason}</p>
      </div>
      {consequences.removedRepair.length > 0 && (
        <aside className="submission-correction-consequence">
          <strong>
            현재 답변에서 직원 조치 정보 {consequences.removedRepair.length}건이
            제외됩니다.
          </strong>
          <ul>
            {consequences.removedRepair.map((answer) => (
              <li key={answer.itemId}>
                {
                  record.template.definition.sections
                    .flatMap((section) => section.items)
                    .find((item) => item.id === answer.itemId)?.label
                }
                {answer.repairNote && (
                  <p className="submission-detail-text">
                    기존 조치 메모: {answer.repairNote}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <p>
            정상 또는 미응답으로 바뀐 항목의 정보입니다. 정정 전 이력에는 그대로
            남습니다.
          </p>
        </aside>
      )}
      {consequences.removedPhotos.length > 0 && (
        <aside className="submission-correction-consequence">
          <strong>
            현재 첨부에서 사진 {consequences.removedPhotos.length}장이
            제외됩니다.
          </strong>
          <ul>
            {consequences.removedPhotos.map((photo) => (
              <li key={photo.id}>
                {submissionPhotoPurpose(photo.purpose)} ·{' '}
                {submissionPhotoLocation(photo, record)}
                <span>{photo.filename}</span>
              </li>
            ))}
          </ul>
          <p>
            파일과 과거 기록의 사진은 삭제되지 않습니다. 다시 이상으로 정정해도
            현재 첨부에 자동으로 복구되지 않습니다.
          </p>
        </aside>
      )}
      <aside className="submission-detail-notice">
        {record.type === 'MAINTENANCE' && (
          <p>
            정비 전·후 사진은 유지됩니다. 계속 이상인 항목의 기존 직원 조치
            정보와 유효한 조치 사진도 유지됩니다.
          </p>
        )}
        <p>
          기존 이상사항의 긴급도·처리 상태·이전 이상사항 연결은 바뀌지 않습니다.
          정상으로 정정해도 해결 처리되지 않습니다.
        </p>
        <p>
          새로 생긴 이상사항에만 답변의 긴급 표시가 적용됩니다. 기존 이상사항의
          긴급도는 이상사항 상세에서 별도로 변경하세요.
        </p>
      </aside>
      {!blocked && (
        <>
          <label className="submission-correction-check">
            <input
              type="checkbox"
              checked={confirmed}
              disabled={disabled || busy}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            <span>
              정정 내용과 사진·직원 조치 정보 처리 안내를 확인했습니다.
            </span>
          </label>
          <div className="submission-detail-actions">
            <Button
              className="admin-button-secondary"
              disabled={disabled || busy}
              onClick={onBack}
            >
              계속 수정
            </Button>
            <Button
              loading={busy}
              disabled={disabled || !confirmed}
              onClick={() => {
                if (confirmed && !disabled && !busy) onSave();
              }}
            >
              {consequences.changed ? '정정 내용 저장' : '동일 내용 확인'}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
