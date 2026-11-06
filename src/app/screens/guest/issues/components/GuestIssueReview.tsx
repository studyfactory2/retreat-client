import type { ReadyGuestIssueReport } from '../model/guest-issue-report-model';

export function GuestIssueReview({
  resource,
}: {
  resource: ReadyGuestIssueReport;
}) {
  const body = resource.attempt?.body ?? resource.reviewed;
  if (!body) return null;
  return (
    <section
      className="guest-card guest-issue-review"
      aria-labelledby="issue-review-title"
    >
      <div className="guest-issue-section-heading">
        <h2 id="issue-review-title">{body.title}</h2>
        <span
          className={`guest-issue-badge${body.isUrgent ? ' is-urgent' : ''}`}
        >
          {body.isUrgent ? '긴급' : '일반'}
        </span>
      </div>
      <dl className="guest-issue-review__identity">
        <div>
          <dt>분류</dt>
          <dd>{resource.reviewCategory?.name ?? '분류 확인 필요'}</dd>
        </div>
        <div>
          <dt>이름</dt>
          <dd>{body.guestName}</dd>
        </div>
      </dl>
      {body.description && (
        <div className="guest-issue-review__content">
          <p className="guest-issue-text">{body.description}</p>
        </div>
      )}
      <p className="guest-issue-hint">
        {body.photos.length > 0
          ? `사진 ${body.photos.length}장과 함께 접수합니다.`
          : '사진 없이 접수합니다.'}
      </p>
    </section>
  );
}
