import { useState } from 'react';
import type { GuestIssueReportInput } from '../../../../features/guest-issues/guest-issues.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { GuestManagerContact } from '../../components/GuestManagerContact';
import type { ReadyGuestIssueReport } from '../model/guest-issue-report-model';

export function GuestIssueReviewActions({
  resource,
  disabled,
  photoBlocked,
  onBack,
  onSubmit,
}: {
  resource: ReadyGuestIssueReport;
  disabled: boolean;
  photoBlocked: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const [confirmation, setConfirmation] =
    useState<GuestIssueReportInput | null>(null);
  const body = resource.attempt?.body ?? resource.reviewed;
  if (!body) return null;
  const confirmed = confirmation === body;
  return (
    <section className="guest-issue-review-actions" aria-label="신고 접수 확인">
      <div className="guest-issue-note">
        <p>접수 후에는 신고 내용이나 사진을 수정할 수 없습니다.</p>
        {body.isUrgent && (
          <p>
            긴급 표시는 관리자 확인용입니다. 바로 도움이 필요하면 관리자에게
            전화해 주세요.
          </p>
        )}
      </div>
      <GuestManagerContact
        phone={resource.context.property.publicContactPhone}
        disabled={resource.access !== 'ready'}
      />
      {!resource.attempt && (
        <>
          {photoBlocked && (
            <p className="guest-issue-field-error" role="alert">
              첨부 사진의 상태를 확인해 주세요. 작성 화면으로 돌아가 사진을
              확인한 뒤 다시 검토할 수 있습니다.
            </p>
          )}
          <label className="guest-issue-confirm">
            <input
              type="checkbox"
              checked={confirmed}
              disabled={disabled || photoBlocked}
              onChange={(event) =>
                setConfirmation(event.target.checked ? body : null)
              }
            />
            <span>내용과 첨부 사진을 확인했습니다.</span>
          </label>
          <div className="guest-issue-actions guest-issue-actions--review">
            <Button
              className="guest-issue-secondary"
              disabled={disabled}
              onClick={onBack}
            >
              내용 수정
            </Button>
            <Button
              disabled={disabled || photoBlocked || !confirmed}
              onClick={() => {
                if (!disabled && !photoBlocked && confirmed) onSubmit();
              }}
            >
              신고 접수
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
