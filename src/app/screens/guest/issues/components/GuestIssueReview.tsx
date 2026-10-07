import { useState } from 'react';
import type { ReadyGuestIssueReport } from '../model/guest-issue-report-model';
import { Button } from '../../../../shared/ui/Button/Button';
import { GuestManagerContact } from '../../components/GuestManagerContact';

export function GuestIssueReview({
  resource,
  disabled,
  onBack,
  onSubmit,
}: {
  resource: ReadyGuestIssueReport;
  disabled: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const body = resource.attempt?.body ?? resource.reviewed;
  if (!body) return null;
  return (
    <section
      className="guest-card guest-issue-review"
      aria-labelledby="issue-review-title"
    >
      <div className="guest-issue-section-heading">
        <span aria-hidden="true">✓</span>
        <h2 id="issue-review-title">보내기 전 확인해 주세요</h2>
      </div>
      <dl>
        <div>
          <dt>휴양소</dt>
          <dd>{resource.context.property.name}</dd>
        </div>
        <div>
          <dt>분류</dt>
          <dd>{resource.reviewCategory?.name ?? '분류 확인 필요'}</dd>
        </div>
        <div>
          <dt>긴급 여부</dt>
          <dd>{body.isUrgent ? '긴급' : '일반'}</dd>
        </div>
        <div>
          <dt>이름</dt>
          <dd>{body.guestName}</dd>
        </div>
        <div>
          <dt>제목</dt>
          <dd>{body.title}</dd>
        </div>
        <div>
          <dt>내용</dt>
          <dd className="guest-issue-text">
            {body.description || '추가 내용 없음'}
          </dd>
        </div>
        <div>
          <dt>사진</dt>
          <dd>{body.photos.length}장 첨부</dd>
        </div>
      </dl>
      <div className="guest-issue-note">
        <p>접수 후에는 이 화면에서 신고 내용이나 사진을 수정할 수 없습니다.</p>
        <p>
          긴급 표시는 별도 알림을 보내지 않습니다. 바로 도움이 필요하면
          관리자에게 직접 연락해 주세요.
        </p>
      </div>
      <GuestManagerContact
        phone={resource.context.property.publicContactPhone}
        disabled={resource.access !== 'ready'}
      />
      {!resource.attempt && (
        <>
          <label className="guest-issue-confirm">
            <input
              type="checkbox"
              checked={confirmed}
              disabled={disabled}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            <span>내용과 첨부 사진을 확인했습니다.</span>
          </label>
          <div className="guest-issue-actions">
            <Button
              className="guest-issue-secondary"
              disabled={disabled}
              onClick={onBack}
            >
              계속 작성
            </Button>
            <Button disabled={disabled || !confirmed} onClick={onSubmit}>
              신고 보내기
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
